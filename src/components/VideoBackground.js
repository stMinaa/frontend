import React from 'react';

function VideoBackground({ videoSrc, children, overlay = true }) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2
        }}
      >
        {videoSrc && <source src={videoSrc} type="video/mp4" />}
      </video>

      {/* Dark Overlay for text readability */}
      {overlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: -1
        }} />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {children}
      </div>
    </div>
  );
}

export default VideoBackground;
