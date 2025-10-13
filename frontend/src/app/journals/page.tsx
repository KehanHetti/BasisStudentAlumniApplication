'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Student, Course, JournalEntry, JournalGoal } from '@/lib/types';
import { api } from '@/lib/api';
import { BookOpen, Target, Plus, Filter, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

export default function JournalsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<JournalGoal[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedEntryType, setSelectedEntryType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPrivate, setShowPrivate] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'goals'>('entries');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editingGoal, setEditingGoal] = useState<JournalGoal | null>(null);
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
        api.getStudents(),
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

      setStudents(studentsData.results || studentsData);
      setCourses(coursesData.results || coursesData);
      setJournalEntries(entriesData.results || entriesData);
      setGoals(goalsData.results || goalsData);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const filteredEntries = journalEntries.filter(entry => 
    searchTerm === '' || 
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGoals = goals.filter(goal => 
    searchTerm === '' || 
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEntry = async () => {
    if (!newEntry.student_id || !newEntry.title || !newEntry.content) {
      alert('Please fill in all required fields (Student, Title, Content)');
      return;
    }

    try {
      // Convert string IDs to integers and filter out empty values
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
      await loadData();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Error creating journal entry. Please try again.');
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.student_id || !newGoal.title) {
      alert('Please fill in all required fields (Student, Title)');
      return;
    }

    try {
      // Convert string ID to integer
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
      await loadData();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Error creating goal. Please try again.');
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
      alert('Please fill in all required fields (Student, Title, Content)');
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
      await loadData();
    } catch (error) {
      console.error('Error updating journal entry:', error);
      alert('Error updating journal entry. Please try again.');
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !newGoal.student_id || !newGoal.title) {
      alert('Please fill in all required fields (Student, Title)');
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
      await loadData();
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Error updating goal. Please try again.');
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      await api.deleteJournalEntry(entryId.toString());
      await loadData();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      alert('Error deleting journal entry. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await api.deleteJournalGoal(goalId.toString());
      await loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal. Please try again.');
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-ui-text-light">Total Entries</p>
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{journalEntries.length}</p>
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
              <p className="text-3xl font-extrabold text-green-600 mt-1">{goals.filter(g => g.status === 'in_progress' || g.status === 'pending').length}</p>
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
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{goals.filter(g => g.status === 'completed').length}</p>
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
              <p className="text-3xl font-extrabold text-logo-primary-blue mt-1">{journalEntries.filter(e => e.entry_type === 'progress').length}</p>
            </div>
            <div className="p-3 rounded-full bg-logo-accent-orange bg-opacity-10 text-logo-accent-orange">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
            activeTab === 'entries'
              ? 'bg-logo-secondary-blue text-white'
              : 'bg-ui-background text-ui-text-light hover:bg-ui-card-background'
          }`}
        >
          Journal Entries
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 ${
            activeTab === 'goals'
              ? 'bg-logo-secondary-blue text-white'
              : 'bg-ui-background text-ui-text-light hover:bg-ui-card-background'
          }`}
        >
          Goals
        </button>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-ui-text-light" />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
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
                onChange={(e) => setSelectedEntryType(e.target.value)}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-secondary-blue focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPrivate(!showPrivate)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                showPrivate
                  ? 'bg-logo-secondary-blue text-white'
                  : 'bg-ui-background text-ui-text-light hover:bg-ui-card-background'
              }`}
            >
              {showPrivate ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {showPrivate ? 'Show Private' : 'Hide Private'}
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 bg-logo-accent-green text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'entries' ? 'Entry' : 'Goal'}
          </button>
        </div>

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
              filteredEntries.map((entry) => (
                <div key={entry.id} className="border border-ui-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-ui-text-dark">{entry.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getEntryTypeColor(entry.entry_type)}`}>
                        {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(entry.priority)}`}>
                        {entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
                      </span>
                      {entry.is_private && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-ui-text-light mb-2">
                    Student: {entry.student.full_name}
                    {entry.course && ` • Course: ${entry.course.name}`}
                  </p>
                  <p className="text-sm text-ui-text-dark mb-2">{entry.content}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ui-text-light">
                      {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                      {entry.created_by && ` • By: ${entry.created_by}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditEntry(entry)}
                        className="text-logo-secondary-blue hover:text-logo-primary-blue"
                        title="Edit entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
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
              filteredGoals.map((goal) => (
                <div key={goal.id} className="border border-ui-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-ui-text-dark">{goal.title}</h3>
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getGoalStatusColor(goal.status)}`}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-ui-text-light mb-2">
                    Student: {goal.student.full_name}
                  </p>
                  {goal.description && (
                    <p className="text-sm text-ui-text-dark mb-2">{goal.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ui-text-light">
                      Created: {new Date(goal.created_at).toLocaleDateString()}
                      {goal.target_date && ` • Target: ${new Date(goal.target_date).toLocaleDateString()}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditGoal(goal)}
                        className="text-logo-secondary-blue hover:text-logo-primary-blue"
                        title="Edit goal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </>
  );
}