'use client';

import Card from '@/components/ui/Card';
import { BookOpen, Target } from 'lucide-react';
import { JournalEntry, JournalGoal } from '@/lib/types';

interface JournalStatsProps {
  entries: JournalEntry[];
  goals: JournalGoal[];
}

export function JournalStats({ entries, goals }: JournalStatsProps) {
  const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'pending').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const progressEntries = entries.filter((e) => e.entry_type === 'progress').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ui-text-light">Total Entries</p>
            <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{entries.length}</p>
          </div>
          <div className="p-3 rounded-full bg-logo-secondary-blue bg-opacity-10 text-logo-secondary-blue">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ui-text-light">Active Goals</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">{activeGoals}</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ui-text-light">Completed Goals</p>
            <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{completedGoals}</p>
          </div>
          <div className="p-3 rounded-full bg-logo-accent-green bg-opacity-10 text-logo-accent-green">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ui-text-light">Progress Entries</p>
            <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{progressEntries}</p>
          </div>
          <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </div>
  );
}

