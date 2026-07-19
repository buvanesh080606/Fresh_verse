import React from 'react';

const GlassContainer = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-effect rounded-2xl shadow-lg border border-brand-border/20 p-6 dark:border-brand-border-dark/10 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassContainer;
