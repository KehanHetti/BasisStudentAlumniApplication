'use client';

import { Edit, Trash2, TrendingUp, Award, AlertTriangle, Target, FileText, Clock } from 'lucide-react';
import { JournalEntry } from '@/lib/types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: number) => void;
  getEntryTypeColor: (type: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  getEntryTypeColor,
  getPriorityColor,
}: JournalEntryCardProps) {
  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'progress':
        return <TrendingUp className="w-3 h-3" />;
      case 'achievement':
        return <Award className="w-3 h-3" />;
      case 'concern':
        return <AlertTriangle className="w-3 h-3" />;
      case 'goal':
        return <Target className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
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

  const isUpdated = entry.updated_at !== entry.created_at;

  return (
    <div className="border border-ui-border rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30 group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-ui-text-dark group-hover:text-logo-secondary-blue transition-colors">
          {entry.title}
        </h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getEntryTypeColor(entry.entry_type)}`}
          >
            {getEntryTypeIcon(entry.entry_type)}
            {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getPriorityColor(entry.priority)}`}
          >
            {entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
          </span>
          {entry.is_private && (
            <span className="inline-flex items-center px-2 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              Private
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-ui-text-light mb-3">
        <span className="font-medium">Student:</span> {entry.student.full_name}
        {entry.course && (
          <>
            {' • '}
            <span className="font-medium">Course:</span> {entry.course.name}
          </>
        )}
      </p>
      <p className="text-sm text-ui-text-dark mb-4 leading-relaxed">{entry.content}</p>
      <div className="flex items-center justify-between pt-3 border-t border-ui-border">
        <div className="flex items-center gap-4 text-xs text-ui-text-light">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Created {new Date(entry.created_at).toLocaleDateString()}</span>
          </div>
          {isUpdated && (
            <div className="flex items-center gap-1 text-blue-600">
              <span>Updated {getTimeAgo(entry.updated_at)}</span>
            </div>
          )}
          {entry.created_by && (
            <span>• By: {entry.created_by}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 text-logo-secondary-blue hover:text-white hover:bg-logo-secondary-blue rounded-lg transition-all duration-200"
            title="Edit entry"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

