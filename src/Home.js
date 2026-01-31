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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(5px)',
        zIndex: 100
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          letterSpacing: '1px'
        }}>
          Smartwalls
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              padding: '10px 25px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid white',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('login')}
            style={{
              padding: '10px 25px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Login
          </button>
        </div>
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
          fontSize: 72,
          fontWeight: 'bold',
          margin: 0,
          marginBottom: 20,
          textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
          letterSpacing: '2px'
        }}>
          Smartwalls
        </h1>
        <p style={{
          fontSize: 28,
          margin: 0,
          marginBottom: 40,
          textShadow: '1px 1px 4px rgba(0,0,0,0.7)',
          fontWeight: 300,
          maxWidth: 700
        }}>
          Tennet's assembly and building management
        </p>
        <button
          onClick={() => onNavigate('login')}
          style={{
            padding: '15px 40px',
            fontSize: 20,
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Get Started
        </button>
      </div>
    </VideoBackground>
  );
}

export default Home;
