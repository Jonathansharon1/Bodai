import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Video, Square, Circle, CheckCircle2 } from 'lucide-react';
import RadarChart from './RadarChart';
import './Section3BaselineLab.css';

const TELEPROMPTER_TEXT = "Introduce yourself, your role, and why you want to improve your presence.";

export default function Section3BaselineLab() {
  const { user } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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
        const fileName = `module1-baseline-${Date.now()}.webm`;
        const videoFile = new File([blob], fileName, { type: 'video/webm' });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        setVideoFile(videoFile);
        setShowTeleprompter(false);
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowTeleprompter(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check your permissions and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Extract video metadata
      const metadata = await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(videoFile);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = url;
        video.onloadedmetadata = () => {
          resolve({
            durationSeconds: video.duration,
            width: video.videoWidth,
            height: video.videoHeight
          });
          URL.revokeObjectURL(url);
        };
        video.onerror = reject;
      });

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('video_duration_seconds', metadata.durationSeconds);
      formData.append('video_width', metadata.width);
      formData.append('video_height', metadata.height);
      formData.append('courseContext', JSON.stringify({
        courseId: 'first-impression-mastery',
        moduleId: 'module-1',
        type: 'baseline'
      }));

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyze-video`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user?.id || '',
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getQuadrant = (warmth, competence) => {
    if (warmth >= 6 && competence >= 6) return 'admiration';
    if (warmth >= 6 && competence < 6) return 'pity';
    if (warmth < 6 && competence >= 6) return 'threat';
    return 'contempt';
  };

  const getQuadrantLabel = (quadrant) => {
    const labels = {
      admiration: 'Admiration Quadrant',
      pity: 'Pity Quadrant',
      threat: 'Envy/Threat Quadrant',
      contempt: 'Contempt Quadrant'
    };
    return labels[quadrant] || quadrant;
  };

  return (
    <section className="section3BaselineLab">
      <div className="section3Container">
        <div className="section3Header">
          <h2 className="section3Title">Phase 3: Establishing Your Baseline</h2>
          <p className="section3Subtitle">
            Now we establish your biological baseline. We need to see how the algorithm reads you.
          </p>
        </div>

        {!analysisResult ? (
          <div className="section3Content">
            {/* Brief */}
            <div className="section3Brief">
              <h3 className="section3BriefTitle">The Brief</h3>
              <p className="section3BriefDescription">
                Now we establish your biological baseline. We need to see how the algorithm reads you.
              </p>
              <div className="section3Rules">
                <div className="section3Rule">
                  <CheckCircle2 size={20} />
                  <span>No acting</span>
                </div>
                <div className="section3Rule">
                  <CheckCircle2 size={20} />
                  <span>Standard lighting</span>
                </div>
                <div className="section3Rule">
                  <CheckCircle2 size={20} />
                  <span>30 Seconds</span>
                </div>
              </div>
            </div>

            {/* Recording Area */}
            <div className="section3RecordingArea">
              {!videoFile ? (
                <>
                  <div className="section3VideoContainer">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="section3Video"
                    />
                    {showTeleprompter && (
                      <div className="section3Teleprompter">
                        <div className="section3TeleprompterText">{TELEPROMPTER_TEXT}</div>
                      </div>
                    )}
                    {isRecording && (
                      <div className="section3RecordingIndicator">
                        <Circle size={12} fill="#ef4444" style={{ marginRight: '8px' }} />
                        {formatTime(recordingTime)}
                      </div>
                    )}
                  </div>

                  <div className="section3Actions">
                    {!isRecording ? (
                      <button
                        className="section3RecordBtn"
                        onClick={startRecording}
                      >
                        <Video size={20} />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        className="section3StopBtn"
                        onClick={stopRecording}
                      >
                        <Square size={20} />
                        Stop Recording
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="section3VideoPreview">
                    <video
                      src={URL.createObjectURL(videoFile)}
                      controls
                      className="section3Video"
                    />
                  </div>
                  <div className="section3Actions">
                    <button
                      className="section3RetakeBtn"
                      onClick={() => {
                        setVideoFile(null);
                        setError(null);
                      }}
                    >
                      Retake
                    </button>
                    <button
                      className="section3AnalyzeBtn"
                      onClick={handleAnalyze}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Analyze Baseline'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Processing Animation */}
            {isProcessing && (
              <div className="section3Processing">
                <div className="section3ProcessingAnimation">
                  <div className="section3ScanLine"></div>
                </div>
                <p className="section3ProcessingText">Analyzing facial geometry and micro-expressions...</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="section3Error">
                <p>{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="section3Results">
            <h3 className="section3ResultsTitle">Your Baseline Analysis</h3>

            {/* Radar Chart */}
            {analysisResult.metrics && analysisResult.metrics.warmth_score !== undefined && (
              <div className="section3RadarContainer">
                <RadarChart
                  warmth={analysisResult.metrics.warmth_score || 5}
                  competence={analysisResult.metrics.competence_score || 5}
                />
              </div>
            )}

            {/* Quadrant Analysis */}
            {analysisResult.metrics && analysisResult.metrics.warmth_score !== undefined && (
              <div className="section3QuadrantAnalysis">
                <div className="section3QuadrantInfo">
                  <h4 className="section3QuadrantTitle">
                    {getQuadrantLabel(
                      getQuadrant(
                        analysisResult.metrics.warmth_score || 5,
                        analysisResult.metrics.competence_score || 5
                      )
                    )}
                  </h4>
                  <div className="section3Scores">
                    <div className="section3Score">
                      <span className="section3ScoreLabel">Warmth:</span>
                      <span className="section3ScoreValue">
                        {typeof analysisResult.metrics.warmth_score === 'number' 
                          ? analysisResult.metrics.warmth_score.toFixed(1) 
                          : 'N/A'}/10
                      </span>
                    </div>
                    <div className="section3Score">
                      <span className="section3ScoreLabel">Competence:</span>
                      <span className="section3ScoreValue">
                        {typeof analysisResult.metrics.competence_score === 'number'
                          ? analysisResult.metrics.competence_score.toFixed(1)
                          : 'N/A'}/10
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gap Analysis */}
                <div className="section3GapAnalysis">
                  <h4 className="section3GapTitle">Analysis</h4>
                  <p className="section3GapText">
                    {analysisResult.metrics.warmth_score >= (analysisResult.metrics.competence_score || 0)
                      ? `Your Warmth markers are ${(analysisResult.metrics.warmth_score || 0) >= 7 ? 'high' : 'moderate'} (Micro-expressions, Eye Softness), but your Competence markers are ${(analysisResult.metrics.competence_score || 0) < 7 ? 'critically low' : 'moderate'} (Posture, Voice).`
                      : `Your Competence markers are ${(analysisResult.metrics.competence_score || 0) >= 7 ? 'high' : 'moderate'} (Posture, Voice), but your Warmth markers are ${(analysisResult.metrics.warmth_score || 0) < 7 ? 'critically low' : 'moderate'} (Micro-expressions, Eye Softness).`}
                  </p>
                  <p className="section3GapText">
                    {getQuadrant(
                      analysisResult.metrics.warmth_score || 5,
                      analysisResult.metrics.competence_score || 5
                    ) === 'threat'
                      ? 'This places you in the Envy/Threat Zone. In Module 2, we will work on "Duchenne Markers" to fix this.'
                      : 'In Module 2, we will work on balancing both dimensions to reach the Admiration Quadrant.'}
                  </p>
                </div>
              </div>
            )}

            {/* Full Analysis Result */}
            {analysisResult.result && (
              <div className="section3FullAnalysis">
                <h4 className="section3FullAnalysisTitle">Detailed Analysis</h4>
                <div className="section3FullAnalysisContent">
                  {analysisResult.result}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

