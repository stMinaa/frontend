/* eslint-disable max-lines-per-function */
import React from 'react';

import VideoBackground from './components/VideoBackground';

function Home({ onNavigate }) {
  return (
    <VideoBackground videoSrc="/building-video.mp4">
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '15px 40px',
        background: '#2c3e50',
        zIndex: 100,
        gap: 30
      }}>
        <button
          onClick={() => onNavigate('home')}
          style={{
            padding: '0',
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 400
          }}
        >
          Home
        </button>
        <button
          onClick={() => onNavigate('login')}
          style={{
            padding: '0',
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 400
          }}
        >
          Login
        </button>
      </div>

      {/* Hero Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        color: 'white',
        padding: '0 20px'
      }}>
        <h1 style={{
          fontSize: 120,
          fontWeight: 300,
          margin: 0,
          marginBottom: 20,
          letterSpacing: '2px'
        }}>
          Smartwalls
        </h1>
        <p style={{
          fontSize: 28,
          margin: 0,
          marginBottom: 40,
          fontWeight: 300,
          maxWidth: 700
        }}>
          Tennet's assembly and building management
        </p>
      </div>
    </VideoBackground>
  );
}

export default Home;
