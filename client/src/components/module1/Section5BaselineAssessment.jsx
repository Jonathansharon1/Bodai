import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import Webcam from 'react-webcam';
import { Square, Circle, Activity } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import './Section5BaselineAssessment.css';

const TELEPROMPTER_TEXT = "Hi, I'm [Name]. I'm taking this course because [Reason], and my goal is [Goal].";

export default function Section5BaselineAssessment() {
  const { user } = useUser();
  const webcamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!webcamRef.current) return;

    try {
      // Get the stream from webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      // Set stream to webcam if it has a video element
      if (webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setIsRecording(false);
        setShowTeleprompter(false);
        setRecordingTime(0);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setShowTeleprompter(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
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
    return `${seconds}s`;
  };

  const handleAnalyze = async () => {
    if (!videoBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert blob to File
      const videoFile = new File([videoBlob], `baseline-${Date.now()}.webm`, { type: 'video/webm' });

      // Extract metadata
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

  // Radar chart data
  const radarData = analysisResult?.metrics ? [
    { axis: 'Warmth', value: analysisResult.metrics.warmth_score || 3 },
    { axis: 'Competence', value: analysisResult.metrics.competence_score || 8 },
    { axis: 'Credibility', value: ((analysisResult.metrics.warmth_score || 3) + (analysisResult.metrics.competence_score || 8)) / 2 }
  ] : [
    { axis: 'Warmth', value: 3 },
    { axis: 'Competence', value: 8 },
    { axis: 'Credibility', value: 5.5 }
  ];

  const getQuadrant = (warmth, competence) => {
    if (warmth >= 6 && competence >= 6) return 'Admiration';
    if (warmth >= 6 && competence < 6) return 'Pity';
    if (warmth < 6 && competence >= 6) return 'Threat';
    return 'Contempt';
  };

  return (
    <motion.section
      className="section5BaselineAssessment"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="section5Container">
        <motion.h2
          className="section5Title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The Baseline Assessment
        </motion.h2>

        {!analysisResult ? (
          <div className="section5Content">
            {/* Brief */}
            <motion.div
              className="section5Brief"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="section5BriefTitle">Establish Biological Baseline</h3>
              <p className="section5BriefText">
                Record a 30-second introduction. No acting. Standard lighting. We need to see how the algorithm reads you.
              </p>
            </motion.div>

            {/* Webcam Area */}
            <div className="section5WebcamArea">
              <div className="section5WebcamContainer">
                <Webcam
                  audio={true}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: 'user'
                  }}
                  className="section5Webcam"
                />
                {showTeleprompter && (
                  <div className="section5Teleprompter">
                    <div className="section5TeleprompterText">{TELEPROMPTER_TEXT}</div>
                  </div>
                )}
                {isRecording && (
                  <div className="section5RecordingIndicator">
                    <Circle size={12} fill="#ef4444" style={{ marginRight: '8px' }} />
                    <span className="section5TimerText">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>

              <div className="section5Controls">
                {!videoBlob ? (
                  <>
                    {!isRecording ? (
                      <button
                        className="section5RecordBtn"
                        onClick={startRecording}
                      >
                        <Circle size={20} fill="#ef4444" />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        className="section5StopBtn"
                        onClick={stopRecording}
                      >
                        <Square size={20} />
                        Stop Recording
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="section5VideoPreview">
                      <video
                        src={URL.createObjectURL(videoBlob)}
                        controls
                        className="section5Video"
                      />
                    </div>
                    <div className="section5Actions">
                      <button
                        className="section5RetakeBtn"
                        onClick={() => {
                          setVideoBlob(null);
                          setError(null);
                        }}
                      >
                        Retake
                      </button>
                      <button
                        className="section5AnalyzeBtn"
                        onClick={handleAnalyze}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Analyze Baseline'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Processing Animation */}
            {isProcessing && (
              <motion.div
                className="section5Processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="section5ProcessingAnimation">
                  <Activity size={48} className="section5ProcessingIcon" />
                  <div className="section5ScanLines"></div>
                </div>
                <p className="section5ProcessingText">Scanning Facial Geometry...</p>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <div className="section5Error">
                <p>{error}</p>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            className="section5Results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="section5ResultsTitle">Baseline Analysis Complete</h3>

            {/* Radar Chart */}
            <div className="section5RadarContainer">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(229, 229, 229, 0.2)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: '#e5e5e5', fontSize: 14, fontFamily: 'Courier New, monospace' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: '#e5e5e5', fontSize: 12, fontFamily: 'Courier New, monospace' }}
                  />
                  <Radar
                    name="Baseline"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Diagnosis */}
            <div className="section5Diagnosis">
              <div className="section5DiagnosisHeader">
                <h4 className="section5DiagnosisTitle">Diagnosis</h4>
                <div className="section5DiagnosisQuadrant">
                  {getQuadrant(
                    analysisResult.metrics?.warmth_score || 3,
                    analysisResult.metrics?.competence_score || 8
                  )} Quadrant
                </div>
              </div>
              <div className="section5DiagnosisScores">
                <div className="section5DiagnosisScore">
                  <span className="section5DiagnosisLabel">Warmth:</span>
                  <span className="section5DiagnosisValue" style={{ color: '#10b981' }}>
                    {analysisResult.metrics?.warmth_score?.toFixed(1) || '3.0'}/10
                  </span>
                </div>
                <div className="section5DiagnosisScore">
                  <span className="section5DiagnosisLabel">Competence:</span>
                  <span className="section5DiagnosisValue" style={{ color: '#3b82f6' }}>
                    {analysisResult.metrics?.competence_score?.toFixed(1) || '8.0'}/10
                  </span>
                </div>
                <div className="section5DiagnosisScore">
                  <span className="section5DiagnosisLabel">Credibility:</span>
                  <span className="section5DiagnosisValue" style={{ color: '#e5e5e5' }}>
                    {(((analysisResult.metrics?.warmth_score || 3) + (analysisResult.metrics?.competence_score || 8)) / 2).toFixed(1)}/10
                  </span>
                </div>
              </div>
              <div className="section5DiagnosisText">
                <p>
                  <strong>High Competence, Critical Low Warmth.</strong> This places you in the Threat Quadrant. 
                  Action: Protocol M2.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

