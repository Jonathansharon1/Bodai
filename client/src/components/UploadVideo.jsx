import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

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
    </>
  );
}

