import React from 'react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}) => {
  const sizeClass = {
    sm: 'spinner-sm',
    md: 'spinner',
    lg: 'spinner-lg'
  }[size] || 'spinner';

  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  } : {};

  return (
    <div className={`loading ${fullScreen ? 'full-screen' : ''}`} style={containerStyle}>
      <div className={sizeClass}></div>
      <span>{message}</span>
    </div>
  );
};

export default LoadingSpinner;
