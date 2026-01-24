import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  actions,
  className = '',
  style = {},
  hoverable = true 
}) => {
  return (
    <div 
      className={`card ${hoverable ? '' : 'no-hover'} ${className}`}
      style={style}
    >
      {(title || subtitle) && (
        <div className="card-header mb-20">
          {title && <h3 className="mb-5">{title}</h3>}
          {subtitle && <p style={{ color: '#718096', fontSize: '14px' }}>{subtitle}</p>}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>

      {actions && (
        <div className="card-footer flex-between gap-10 mt-20">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Card;
