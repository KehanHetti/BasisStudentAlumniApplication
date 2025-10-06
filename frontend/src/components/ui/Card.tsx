// src/components/ui/Card.tsx

import React from 'react';

interface CardProps {
  title?: string; // Made title optional
  children: React.ReactNode;
  className?: string;
}

const Card = ({ title, children, className = '' }: CardProps) => {
  return (
    <div className={`bg-ui-card-background p-6 rounded-xl shadow-custom-md border border-ui-border ${className}`}>
      {title && <h3 className="text-lg font-bold text-ui-text-dark mb-4 tracking-tight">{title}</h3>}
      <div>{children}</div>
    </div>
  );
};

export default Card;
