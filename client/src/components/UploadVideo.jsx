import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Video, X, Circle, Square } from 'lucide-react';

const MAX_UPLOAD_MB = 250;

const extractVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      const metadata = {
        durationSeconds: Number.isFinite(video.duration) ? video.duration : null,
        width: video.videoWidth || null,
        height: video.videoHeight || null
      };
      URL.revokeObjectURL(url);
      resolve(metadata);
    };
    video.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
  });
};

export default function UploadVideo({ file, onSelect, onClear }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const mountedRef = useRef(true);
  
  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const attachMetadataAndSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) {
      onSelect(null);
      return;
    }
    try {
      const metadata = await extractVideoMetadata(selectedFile);
      selectedFile.bodaiMeta = {
        durationSeconds: metadata.durationSeconds ? Math.round(metadata.durationSeconds) : null,
        width: metadata.width,
        height: metadata.height
      };
    } catch (err) {
      console.warn('Failed to read video metadata:', err);
      selectedFile.bodaiMeta = null;
    }
    if (!mountedRef.current) return;
    onSelect(selectedFile);
    setShowSuccess(true);
    setTimeout(() => {
      if (mountedRef.current) {
        setShowSuccess(false);
      }
    }, 3000);
  }, [onSelect]);

  const onPick = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    inputRef.current?.click();
  };
  const onChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      attachMetadataAndSelect(f);
    } else {
      onSelect(null);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;
    const f = dt.files[0];
    if (f && f.type?.startsWith('video/')) {
      attachMetadataAndSelect(f);
    }
  }, [attachMetadataAndSelect]);

  // Hide success message when file is removed
  useEffect(() => {
    if (!file) {
      setShowSuccess(false);
    }
  }, [file]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Convert blob to File
        const fileName = `recording-${Date.now()}.webm`;
        const videoFile = new File([blob], fileName, { type: 'video/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clean up video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Close modal and select the file
        setShowRecordModal(false);
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Attach metadata and select
        await attachMetadataAndSelect(videoFile);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check your permissions and try again.');
    }
  }, [attachMetadataAndSelect]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      chunksRef.current = [];
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setShowRecordModal(false);
    setIsRecording(false);
    setRecordingTime(0);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordClick = (e) => {
    e.stopPropagation();
    setShowRecordModal(true);
  };

  return (
    <>
      {/* Success Toast Notification */}
      {showSuccess && file && (
        <div className="uploadSuccessToast">
          <div className="uploadSuccessToast__content">
            <CheckCircle2 className="uploadSuccessToast__icon" size={20} />
            <div className="uploadSuccessToast__text">
              <div className="uploadSuccessToast__title">Video uploaded successfully!</div>
              <div className="uploadSuccessToast__subtitle">{file.name}</div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`dropZone ${isDragging ? 'dropZone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onClick={onPick}
        aria-label="Upload video by clicking or dragging a file here"
      >
        <div className="dropZone__icon">⭳</div>
        <div className="dropZone__title">Drag & drop your video here</div>
        <div className="dropZone__or">or</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn btn--primary" 
            onClick={(e) => {
              e.stopPropagation();
              onPick(e);
            }}
          >
            Upload Video
          </button>
          <button 
            type="button" 
            className="btn btn--secondary" 
            onClick={handleRecordClick}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Video size={18} />
            Record Video
          </button>
        </div>
        <div className="dropZone__meta">Accepted: MP4, MOV, WebM · Max {MAX_UPLOAD_MB}MB</div>
      </div>

      <div className="uploadRow" style={{ marginBottom: 12 }}>
        <input
          ref={inputRef}
          className="hiddenInput"
          type="file"
          accept="video/*"
          onChange={onChange}
        />
        <div className="fileName" style={{ flex: 1 }}>
          {file ? `${file.name} (${Math.round(file.size / 1024 / 1024 * 10) / 10} MB)` : 'No file selected'}
        </div>
        {file && (
          <button className="pill-remove" onClick={onClear} aria-label="Remove file">Remove</button>
        )}
      </div>

      {/* Recording Modal */}
      {showRecordModal && (
        <div className="recordModal">
          <div className="recordModal__overlay" onClick={cancelRecording} />
          <div className="recordModal__content">
            <div className="recordModal__header">
              <h3>Record Video</h3>
              <button 
                className="recordModal__close" 
                onClick={cancelRecording}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="recordModal__video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
              />
              {isRecording && (
                <div className="recordModal__timer">
                  <Circle size={12} fill="#ef4444" style={{ marginRight: '8px' }} />
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>

            <div className="recordModal__actions">
              {!isRecording ? (
                <button 
                  className="btn btn--primary" 
                  onClick={startRecording}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Video size={18} />
                  Start Recording
                </button>
              ) : (
                <button 
                  className="btn btn--danger" 
                  onClick={stopRecording}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Square size={18} />
                  Stop Recording
                </button>
              )}
              <button 
                className="btn btn--ghost" 
                onClick={cancelRecording}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

