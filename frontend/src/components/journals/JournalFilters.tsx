'use client';

import { Filter, Search, Eye, EyeOff, Plus, CalendarDays } from 'lucide-react';
import { Student } from '@/lib/types';

interface JournalFiltersProps {
  students: Student[];
  selectedStudent: string;
  selectedEntryType: string;
  searchTerm: string;
  showPrivate: boolean;
  activeTab: 'entries' | 'goals';
  dateFrom?: string;
  dateTo?: string;
  onStudentChange: (value: string) => void;
  onEntryTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onTogglePrivate: () => void;
  onToggleAddForm: () => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
}

export function JournalFilters({
  students,
  selectedStudent,
  selectedEntryType,
  searchTerm,
  showPrivate,
  activeTab,
  dateFrom,
  dateTo,
  onStudentChange,
  onEntryTypeChange,
  onSearchChange,
  onTogglePrivate,
  onToggleAddForm,
  onDateFromChange,
  onDateToChange,
}: JournalFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-ui-border">
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-ui-text-light" />
        <select
          value={selectedStudent}
          onChange={(e) => onStudentChange(e.target.value)}
          className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
        >
          <option value="">All Students</option>
          {students.map((student) => (
            <option key={student.id} value={student.id.toString()}>
              {student.full_name}
            </option>
          ))}
        </select>
      </div>

      {activeTab === 'entries' && (
        <div className="flex items-center space-x-2">
          <select
            value={selectedEntryType}
            onChange={(e) => onEntryTypeChange(e.target.value)}
            className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
          >
            <option value="">All Entry Types</option>
            <option value="progress">Progress</option>
            <option value="achievement">Achievement</option>
            <option value="concern">Concern</option>
            <option value="goal">Goal</option>
            <option value="general">General</option>
          </select>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-ui-text-light" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
        />
      </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onTogglePrivate}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                showPrivate
                  ? 'bg-logo-secondary-blue text-white'
                  : 'bg-ui-background text-ui-text-light hover:bg-ui-card-background'
              }`}
              title={showPrivate ? 'Currently showing private entries. Click to hide them.' : 'Currently hiding private entries. Click to show them.'}
            >
              {showPrivate ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {showPrivate ? 'Show Private' : 'Hide Private'}
            </button>
            <span className="text-xs text-ui-text-light hidden sm:inline" title="Toggle visibility of private journal entries">
              (Private entries are only visible to admins)
            </span>
          </div>

          {onDateFromChange && onDateToChange && (
            <>
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-ui-text-light flex-shrink-0" />
                <label className="sr-only">From Date</label>
                <input
                  type="date"
                  value={dateFrom || ''}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="px-3 py-2 border-2 border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-logo-secondary-blue bg-white text-ui-text-dark font-medium"
                  aria-label="Filter from date"
                  placeholder="From"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="sr-only">To Date</label>
                <input
                  type="date"
                  value={dateTo || ''}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="px-3 py-2 border-2 border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-logo-secondary-blue bg-white text-ui-text-dark font-medium"
                  aria-label="Filter to date"
                  placeholder="To"
                />
              </div>
            </>
          )}

          <button
            onClick={onToggleAddForm}
            className="inline-flex items-center px-4 py-2 bg-logo-accent-green text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'entries' ? 'Entry' : 'Goal'}
          </button>
        </div>
  );
}

