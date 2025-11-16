import React, { useEffect, useState } from 'react';

export default function VideoPlayer({ file, videoUrl, mimeType }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    // If videoUrl is provided (from S3), use it directly
    if (videoUrl) {
      setUrl(videoUrl);
      return;
    }

    // Otherwise, create object URL from file
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, videoUrl]);

  if (!url) return null;

  return (
    <div style={{ marginTop: 12, marginBottom: 24 }}>
      <video
        src={url}
        controls
        style={{ width: '100%', maxWidth: '100%', borderRadius: 12, border: '1px solid var(--border-light)' }}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

