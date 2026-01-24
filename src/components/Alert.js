import React, { useState, useEffect } from 'react';

const Alert = ({ 
  type = 'info', 
  message, 
  onClose, 
  autoClose = true,
  duration = 5000 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, visible, onClose]);

  if (!visible || !message) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={`alert alert-${type} fade-in`}>
      <div className="flex-between">
        <span>{message}</span>
        <button 
          className="btn btn-sm btn-outline"
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: 'inherit',
            fontSize: '20px',
            padding: '0'
          }}
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Alert;
