import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import UploadVideo from '../components/UploadVideo';
import VideoPlayer from '../components/VideoPlayer';
import AnalysisResult from '../components/AnalysisResult';
import LoadingView from '../components/LoadingView';
import './AnalysisPage.css';

export default function AnalysisPage({ 
  file, 
  onSelect, 
  onRemove, 
  onAnalyze, 
  isLoading, 
  result, 
  viewingAnalysis,
  onBackToDashboard,
  currentAnalysisId
}) {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadedAnalysis, setLoadedAnalysis] = useState(null);

  // Fetch analysis data if viewing by ID from URL
  useEffect(() => {
    if (id && user?.id && !viewingAnalysis && !loadedAnalysis) {
      fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyses/${id}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          if (data.analysis) {
            setLoadedAnalysis(data.analysis);
          }
        })
        .catch(err => {
          console.error('Failed to fetch analysis:', err);
          navigate('/dashboard');
        });
    }
  }, [id, user, viewingAnalysis, loadedAnalysis, navigate]);

  // Fetch video URL if viewing an existing analysis
  useEffect(() => {
    const analysis = viewingAnalysis || loadedAnalysis;
    if (analysis?.s3_key && user?.id && !videoUrl) {
      fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyses/${analysis.id}/video-url`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          if (data.video_url) {
            setVideoUrl(data.video_url);
          }
        })
        .catch(err => console.error('Failed to fetch video URL:', err));
    } else if (!analysis) {
      setVideoUrl(null);
    }
  }, [viewingAnalysis, loadedAnalysis, user, videoUrl]);

  return (
    <div className="analysisPage">
      {/* Top Navigation Bar */}
      <div className="analysisPage__topNav">
        <div className="analysisPage__topNavContent">
          <a className="analysisPage__logo" href="/" onClick={(e) => {
            e.preventDefault();
            onBackToDashboard();
          }}>
            <Logo size={28} className="analysisPage__logoIcon" />
            <span className="analysisPage__logoText">BodAI</span>
          </a>
          <div className="analysisPage__topNavRight">
            <button 
              className="analysisPage__navButton"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={18} />
              <span>Dashboard</span>
            </button>
            <div className="analysisPage__userButton">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="analysisPage__header">
        {(viewingAnalysis || loadedAnalysis) ? (
          <div className="analysisPage__headerContent">
            <div className="analysisPage__headerText">
              <h1 className="analysisPage__title">View Analysis</h1>
              <p className="analysisPage__subtitle">{(viewingAnalysis || loadedAnalysis)?.video_filename}</p>
            </div>
          </div>
        ) : (
          <div className="analysisPage__headerContent">
            <div className="analysisPage__headerText">
              <h1 className="analysisPage__title">New Video Analysis</h1>
              <p className="analysisPage__subtitle">Upload your video to get AI-powered body language insights</p>
            </div>
          </div>
        )}
      </div>

      <div className="analysisPage__content">
        {/* Viewing existing analysis */}
        {(viewingAnalysis || loadedAnalysis) ? (
          <>
            <div className="analysisPage__analysisInfo">
              <div className="analysisPage__date">
                {new Date((viewingAnalysis || loadedAnalysis).created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="analysisPage__filename">
                {(viewingAnalysis || loadedAnalysis).video_filename}
              </div>
            </div>

            {videoUrl && (
              <div className="analysisPage__video">
                <VideoPlayer 
                  videoUrl={videoUrl} 
                  mimeType={(viewingAnalysis || loadedAnalysis).mime_type}
                />
              </div>
            )}

            <div className="analysisPage__result">
              <AnalysisResult 
                markdown={(viewingAnalysis || loadedAnalysis).analysis_result} 
                loading={false}
                analysisId={(viewingAnalysis || loadedAnalysis).id}
                viewingAnalysis={viewingAnalysis || loadedAnalysis}
              />
            </div>
          </>
        ) : (
          <>
            {/* New analysis flow */}
            {!isLoading && !result && (
              <>
                <div className="analysisPage__upload">
                  <UploadVideo file={file} onSelect={onSelect} onClear={onRemove} />
                </div>

                {file && (
                  <div className="analysisPage__preview">
                    <VideoPlayer file={file} />
                  </div>
                )}

                {file && (
                  <div className="analysisPage__actions">
                    <button 
                      className="btn btn--primary" 
                      onClick={onAnalyze} 
                      disabled={!file || isLoading}
                    >
                      Analyze Video
                    </button>
                  </div>
                )}
              </>
            )}

            {isLoading && (
              <div className="analysisPage__loading">
                <LoadingView active />
              </div>
            )}

            {result && !isLoading && (
              <>
                {file && (
                  <div className="analysisPage__preview">
                    <VideoPlayer file={file} />
                  </div>
                )}
                <div className="analysisPage__result">
                  <AnalysisResult 
                    markdown={result} 
                    loading={false}
                    analysisId={currentAnalysisId}
                  />
                </div>
                <div className="analysisPage__actions">
                  <button 
                    className="btn btn--primary" 
                    onClick={onBackToDashboard}
                  >
                    View in Dashboard
                  </button>
                  <button 
                    className="btn btn--ghost" 
                    onClick={() => {
                      onRemove();
                      setVideoUrl(null);
                    }}
                  >
                    Analyze Another Video
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


