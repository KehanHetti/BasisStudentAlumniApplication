'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { Users, Search, Filter, MoreVertical, Shield, User, UserCheck } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  profile: {
    role: string;
    phone: string;
    is_verified: boolean;
  };
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ui-text-dark mb-4">Access Denied</h1>
          <p className="text-ui-text-light">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/stats/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        // For now, we'll create mock data since we don't have a users endpoint
        const mockUsers: UserData[] = [
          {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            is_active: true,
            date_joined: new Date().toISOString(),
            profile: {
              role: 'admin',
              phone: '',
              is_verified: true,
            },
          },
        ];
        setUsers(mockUsers);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'teacher':
        return 'text-blue-600 bg-blue-100';
      case 'student':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'teacher':
        return <UserCheck className="h-4 w-4" />;
      case 'student':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.profile.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ui-text-dark">User Management</h1>
        <p className="text-ui-text-light mt-2">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ui-text-light" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border rounded-lg focus:ring-2 focus:ring-logo-primary-blue focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-ui-text-dark">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-sm text-ui-text-light">{user.email}</p>
                  <p className="text-sm text-ui-text-light">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleColor(user.profile.role)}`}>
                  {getRoleIcon(user.profile.role)}
                  {user.profile.role.charAt(0).toUpperCase() + user.profile.role.slice(1)}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-ui-text-light">
                    Joined: {new Date(user.date_joined).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-ui-text-light">
                    Status: {user.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-4 w-4 text-ui-text-light" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-ui-text-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ui-text-dark mb-2">No Users Found</h3>
            <p className="text-ui-text-light">
              {searchTerm || roleFilter !== 'all' 
                ? 'No users match your search criteria.' 
                : 'No users found in the system.'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
