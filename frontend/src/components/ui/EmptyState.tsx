'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, illustration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {illustration ? (
        illustration
      ) : (
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-logo-primary-blue/10 to-logo-secondary-blue/10 flex items-center justify-center mb-6">
          <Icon className="w-12 h-12 text-logo-secondary-blue opacity-60" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ui-text-dark mb-2">{title}</h3>
      <p className="text-sm text-ui-text-light text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-logo-secondary-blue text-white font-semibold rounded-lg hover:bg-logo-primary-blue transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

