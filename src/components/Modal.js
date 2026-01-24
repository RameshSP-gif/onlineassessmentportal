import React from 'react';

const Modal = ({ 
  isOpen, 
  title, 
  children, 
  onClose,
  actions,
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '500px' },
    lg: { maxWidth: '700px' },
    xl: { maxWidth: '900px' }
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleBackdropClick}
    >
      <div 
        className="modal"
        style={sizeStyles[size] || sizeStyles.md}
      >
        {title && (
          <div className="flex-between mb-20">
            <h2 style={{ margin: 0 }}>{title}</h2>
            <button 
              className="btn btn-sm btn-outline"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '24px',
                padding: '0',
                width: 'auto'
              }}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>

        {actions && (
          <div className="modal-footer flex gap-10 mt-30">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
