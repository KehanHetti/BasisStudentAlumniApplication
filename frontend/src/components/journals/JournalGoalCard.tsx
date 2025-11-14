'use client';

import { Edit, Trash2, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { JournalGoal } from '@/lib/types';

interface JournalGoalCardProps {
  goal: JournalGoal;
  onEdit: (goal: JournalGoal) => void;
  onDelete: (goalId: number) => void;
  getGoalStatusColor: (status: string) => string;
}

export function JournalGoalCard({
  goal,
  onEdit,
  onDelete,
  getGoalStatusColor,
}: JournalGoalCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'in_progress':
        return <Loader className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const isUpdated = goal.updated_at !== goal.created_at;

  return (
    <div className="border border-ui-border rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30 group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-ui-text-dark group-hover:text-logo-secondary-blue transition-colors">
          {goal.title}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getGoalStatusColor(goal.status)}`}
        >
          {getStatusIcon(goal.status)}
          {goal.status.charAt(0).toUpperCase() + goal.status.slice(1).replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-ui-text-light mb-3">
        <span className="font-medium">Student:</span> {goal.student.full_name}
      </p>
      {goal.description && (
        <p className="text-sm text-ui-text-dark mb-4 leading-relaxed">{goal.description}</p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-ui-border">
        <div className="flex items-center gap-4 text-xs text-ui-text-light">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Created {new Date(goal.created_at).toLocaleDateString()}</span>
          </div>
          {isUpdated && (
            <div className="flex items-center gap-1 text-blue-600">
              <span>Updated {getTimeAgo(goal.updated_at)}</span>
            </div>
          )}
          {goal.target_date && (
            <div className="flex items-center gap-1">
              <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-logo-secondary-blue hover:text-white hover:bg-logo-secondary-blue rounded-lg transition-all duration-200"
            title="Edit goal"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

