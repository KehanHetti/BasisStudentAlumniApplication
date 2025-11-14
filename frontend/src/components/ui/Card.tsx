// src/components/ui/Card.tsx

import React from 'react';

interface CardProps {
  title?: string; // Made title optional
  children: React.ReactNode;
  className?: string;
}

const Card = ({ title, children, className = '' }: CardProps) => {
  return (
    <div className={`bg-ui-card-background p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-lg border border-ui-border hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {title && <h3 className="text-base sm:text-lg font-bold text-ui-text-dark mb-3 sm:mb-4 tracking-tight">{title}</h3>}
      <div>{children}</div>
    </div>
  );
};

export default Card;
