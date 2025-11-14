'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Student, Course, JournalEntry, JournalGoal } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { JournalStats } from '@/components/journals/JournalStats';
import { JournalFilters } from '@/components/journals/JournalFilters';
import { JournalEntryCard } from '@/components/journals/JournalEntryCard';
import { JournalGoalCard } from '@/components/journals/JournalGoalCard';
import { extractArrayFromResponse } from '@/lib/apiHelpers';

export default function JournalsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<JournalGoal[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedEntryType, setSelectedEntryType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPrivate, setShowPrivate] = useState<boolean>(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entries' | 'goals'>('entries');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editingGoal, setEditingGoal] = useState<JournalGoal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'entry' | 'goal'; id: number } | null>(null);
  const { showToast } = useToast();
  const [newEntry, setNewEntry] = useState({
    student_id: '',
    course_id: '',
    entry_type: 'general',
    title: '',
    content: '',
    priority: 'medium',
    is_private: false,
    created_by: 'Admin User',
  });
  const [newGoal, setNewGoal] = useState({
    student_id: '',
    title: '',
    description: '',
    target_date: '',
    status: 'pending',
  });

  useEffect(() => {
    loadData();
  }, [selectedStudent, selectedEntryType, showPrivate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData, entriesData, goalsData] = await Promise.all([
        api.getStudents({ all: true }),
        api.getCourses(),
        api.getJournalEntries({
          student_id: selectedStudent || undefined,
          entry_type: selectedEntryType || undefined,
          is_private: showPrivate ? undefined : false,
        }),
        api.getJournalGoals({
          student_id: selectedStudent || undefined,
        }),
      ]);

      setStudents(extractArrayFromResponse<Student>(studentsData as Student[] | { results: Student[] }));
      setCourses(extractArrayFromResponse<Course>(coursesData as Course[] | { results: Course[] }));
      setJournalEntries(extractArrayFromResponse<JournalEntry>(entriesData as JournalEntry[] | { results: JournalEntry[] }));
      setGoals(extractArrayFromResponse<JournalGoal>(goalsData as JournalGoal[] | { results: JournalGoal[] }));
    } catch (error) {
      showToast('Failed to load data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'achievement':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'concern':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'goal':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'general':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.student.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStudent = selectedStudent === '' || entry.student.id.toString() === selectedStudent;
    const matchesType = selectedEntryType === '' || entry.entry_type === selectedEntryType;
    const matchesPrivate = showPrivate || !entry.is_private;
    
    const entryDate = new Date(entry.created_at);
    const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || entryDate <= new Date(dateTo + 'T23:59:59');
    
    return matchesSearch && matchesStudent && matchesType && matchesPrivate && matchesDateFrom && matchesDateTo;
  });

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = searchTerm === '' || 
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.student.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStudent = selectedStudent === '' || goal.student.id.toString() === selectedStudent;
    
    const goalDate = new Date(goal.created_at);
    const matchesDateFrom = !dateFrom || goalDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || goalDate <= new Date(dateTo + 'T23:59:59');
    
    return matchesSearch && matchesStudent && matchesDateFrom && matchesDateTo;
  });

  const totalPagesEntries = Math.ceil(filteredEntries.length / itemsPerPage);
  const totalPagesGoals = Math.ceil(filteredGoals.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const paginatedGoals = filteredGoals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddEntry = async () => {
    if (!newEntry.student_id || !newEntry.title || !newEntry.content) {
      showToast('Please fill in all required fields (Student, Title, Content)', 'warning');
      return;
    }

    try {
      const entryData = {
        ...newEntry,
        student_id: parseInt(newEntry.student_id),
        course_id: newEntry.course_id ? parseInt(newEntry.course_id) : undefined,
      };
      
      await api.createJournalEntry(entryData);
      setNewEntry({
        student_id: '',
        course_id: '',
        entry_type: 'general',
        title: '',
        content: '',
        priority: 'medium',
        is_private: false,
        created_by: 'Admin User',
      });
      setShowAddForm(false);
      showToast('Journal entry created successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to create journal entry. Please try again.', 'error');
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.student_id || !newGoal.title) {
      showToast('Please fill in all required fields (Student, Title)', 'warning');
      return;
    }

    try {
      const goalData = {
        ...newGoal,
        student_id: parseInt(newGoal.student_id),
      };
      
      await api.createJournalGoal(goalData);
      setNewGoal({
        student_id: '',
        title: '',
        description: '',
        target_date: '',
        status: 'pending',
      });
      setShowAddForm(false);
      showToast('Goal created successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to create goal. Please try again.', 'error');
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      student_id: entry.student.id.toString(),
      course_id: entry.course?.id?.toString() || '',
      entry_type: entry.entry_type,
      title: entry.title,
      content: entry.content,
      priority: entry.priority,
      is_private: entry.is_private,
      created_by: entry.created_by || 'Admin User',
    });
    setShowAddForm(true);
  };

  const handleEditGoal = (goal: JournalGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      student_id: goal.student.id.toString(),
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date || '',
      status: goal.status,
    });
    setShowAddForm(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !newEntry.student_id || !newEntry.title || !newEntry.content) {
      showToast('Please fill in all required fields (Student, Title, Content)', 'warning');
      return;
    }

    try {
      const entryData = {
        ...newEntry,
        student_id: parseInt(newEntry.student_id),
        course_id: newEntry.course_id ? parseInt(newEntry.course_id) : undefined,
      };
      
      await api.updateJournalEntry(editingEntry.id.toString(), entryData);
      setEditingEntry(null);
      setNewEntry({
        student_id: '',
        course_id: '',
        entry_type: 'general',
        title: '',
        content: '',
        priority: 'medium',
        is_private: false,
        created_by: 'Admin User',
      });
      setShowAddForm(false);
      showToast('Journal entry updated successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to update journal entry. Please try again.', 'error');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !newGoal.student_id || !newGoal.title) {
      showToast('Please fill in all required fields (Student, Title)', 'warning');
      return;
    }

    try {
      const goalData = {
        ...newGoal,
        student_id: parseInt(newGoal.student_id),
      };
      
      await api.updateJournalGoal(editingGoal.id.toString(), goalData);
      setEditingGoal(null);
      setNewGoal({
        student_id: '',
        title: '',
        description: '',
        target_date: '',
        status: 'pending',
      });
      setShowAddForm(false);
      showToast('Goal updated successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to update goal. Please try again.', 'error');
    }
  };

  const handleDeleteEntry = (entryId: number) => {
    setDeleteConfirm({ type: 'entry', id: entryId });
  };

  const handleDeleteGoal = (goalId: number) => {
    setDeleteConfirm({ type: 'goal', id: goalId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'entry') {
        await api.deleteJournalEntry(deleteConfirm.id.toString());
        showToast('Journal entry deleted successfully', 'success');
      } else {
        await api.deleteJournalGoal(deleteConfirm.id.toString());
        showToast('Goal deleted successfully', 'success');
      }
      setDeleteConfirm(null);
      await loadData();
    } catch (error) {
      showToast(`Failed to delete ${deleteConfirm.type}. Please try again.`, 'error');
      setDeleteConfirm(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditingGoal(null);
    setNewEntry({
      student_id: '',
      course_id: '',
      entry_type: 'general',
      title: '',
      content: '',
      priority: 'medium',
      is_private: false,
      created_by: 'Admin User',
    });
    setNewGoal({
      student_id: '',
      title: '',
      description: '',
      target_date: '',
      status: 'pending',
    });
    setShowAddForm(false);
  };

  return (
    <>
      <h1 className="sr-only">Student Journals</h1>

      <JournalStats entries={journalEntries} goals={goals} />

      {/* Tabs and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="flex space-x-1">
          <button
            onClick={() => {
              setActiveTab('entries');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'entries'
                ? 'bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white shadow-lg'
                : 'bg-ui-background text-ui-text-light hover:bg-ui-card-background'
            }`}
          >
            Journal Entries
          </button>
          <button
            onClick={() => {
              setActiveTab('goals');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue text-white shadow-lg'
                : 'bg-ui-background text-ui-text-light hover:bg-ui-card-background'
            }`}
          >
            Goals
          </button>
        </div>
        <button
          onClick={() => setCompactView(!compactView)}
          className="inline-flex items-center px-3 py-2 border border-ui-border rounded-lg hover:bg-ui-background transition-colors"
          title={compactView ? 'Switch to detailed view' : 'Switch to compact view'}
        >
          {compactView ? <List className="w-4 h-4 mr-2" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
          {compactView ? 'Detailed' : 'Compact'}
        </button>
      </div>

      <Card>
        <JournalFilters
          students={students}
          selectedStudent={selectedStudent}
          selectedEntryType={selectedEntryType}
          searchTerm={searchTerm}
          showPrivate={showPrivate}
          activeTab={activeTab}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onStudentChange={setSelectedStudent}
          onEntryTypeChange={setSelectedEntryType}
          onSearchChange={setSearchTerm}
          onTogglePrivate={() => setShowPrivate(!showPrivate)}
          onToggleAddForm={() => setShowAddForm(!showAddForm)}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 p-4 border border-ui-border rounded-lg bg-ui-background">
            <h3 className="text-lg font-semibold text-ui-text-dark mb-4">
              {editingEntry || editingGoal ? 'Edit' : 'Add New'} {activeTab === 'entries' ? 'Journal Entry' : 'Goal'}
            </h3>
            
            {activeTab === 'entries' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ui-text-light mb-2">
                      Student *
                    </label>
                    <select
                      value={newEntry.student_id}
                      onChange={(e) => setNewEntry({...newEntry, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id.toString()}>
                          {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-text-light mb-2">
                      Course
                    </label>
                    <select
                      value={newEntry.course_id}
                      onChange={(e) => setNewEntry({...newEntry, course_id: e.target.value})}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="">Select Course (Optional)</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id.toString()}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-text-light mb-2">
                      Entry Type
                    </label>
                    <select
                      value={newEntry.entry_type}
                      onChange={(e) => setNewEntry({...newEntry, entry_type: e.target.value})}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="progress">Progress</option>
                      <option value="achievement">Achievement</option>
                      <option value="concern">Concern</option>
                      <option value="goal">Goal</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-text-light mb-2">
                      Priority
                    </label>
                    <select
                      value={newEntry.priority}
                      onChange={(e) => setNewEntry({...newEntry, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Enter entry title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Content *
                  </label>
                  <textarea
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Enter entry content"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newEntry.is_private}
                      onChange={(e) => setNewEntry({...newEntry, is_private: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-ui-text-light">Private entry</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-ui-text-light hover:text-ui-text-dark transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingEntry ? handleUpdateEntry : handleAddEntry}
                    className="px-4 py-2 bg-logo-secondary-blue text-white font-semibold rounded-lg hover:bg-logo-primary-blue transition-colors duration-200"
                  >
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ui-text-light mb-2">
                      Student *
                    </label>
                    <select
                      value={newGoal.student_id}
                      onChange={(e) => setNewGoal({...newGoal, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id.toString()}>
                          {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-text-light mb-2">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={newGoal.target_date}
                      onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                      className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Enter goal title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-text-light mb-2">
                    Description
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
                    placeholder="Enter goal description"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-ui-text-light hover:text-ui-text-dark transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
                    className="px-4 py-2 bg-logo-secondary-blue text-white font-semibold rounded-lg hover:bg-logo-primary-blue transition-colors duration-200"
                  >
                    {editingGoal ? 'Update Goal' : 'Add Goal'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Journal Entries */}
        {activeTab === 'entries' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-ui-text-light">
                Loading journal entries...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-ui-text-light">
                No journal entries found.
              </div>
            ) : (
              <>
                {paginatedEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    getEntryTypeColor={getEntryTypeColor}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
                {totalPagesEntries > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-ui-border">
                    <div className="text-sm text-ui-text-light">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-2 text-sm text-ui-text-dark">
                        Page {currentPage} of {totalPagesEntries}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPagesEntries, prev + 1))}
                        disabled={currentPage === totalPagesEntries}
                        className="p-2 border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Goals */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-ui-text-light">
                Loading goals...
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="text-center py-8 text-ui-text-light">
                No goals found.
              </div>
            ) : (
              <>
                {paginatedGoals.map((goal) => (
                  <JournalGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    getGoalStatusColor={getGoalStatusColor}
                  />
                ))}
                {totalPagesGoals > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-ui-border">
                    <div className="text-sm text-ui-text-light">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredGoals.length)} of {filteredGoals.length} goals
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-2 text-sm text-ui-text-dark">
                        Page {currentPage} of {totalPagesGoals}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPagesGoals, prev + 1))}
                        disabled={currentPage === totalPagesGoals}
                        className="p-2 border border-ui-border rounded-lg hover:bg-ui-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title={`Delete ${deleteConfirm?.type === 'entry' ? 'Journal Entry' : 'Goal'}`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  );
}