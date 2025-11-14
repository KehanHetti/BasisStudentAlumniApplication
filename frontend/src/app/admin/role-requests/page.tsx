'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { Shield, Check, X, Clock, User } from 'lucide-react';
import { extractArrayFromResponse } from '@/lib/apiHelpers';

interface RoleRequest {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  requested_role: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export default function RoleRequestsPage() {
  const { user } = useAuth();
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchRoleRequests();
  }, []);

  const fetchRoleRequests = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/role-requests/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const requestsArray = extractArrayFromResponse<RoleRequest>(data as RoleRequest[] | { results: RoleRequest[] });
        setRoleRequests(requestsArray);
      } else {
        setError('Failed to fetch role requests');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/auth/role-requests/${requestId}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchRoleRequests(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/auth/role-requests/${requestId}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchRoleRequests(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading role requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ui-text-dark">Role Requests</h1>
        <p className="text-ui-text-light mt-2">
          Review and approve user role change requests
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Role Requests List */}
      <div className="space-y-4">
        {roleRequests.map((request) => (
          <Card key={request.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ui-text-dark">
                      {request.user.first_name} {request.user.last_name}
                    </h3>
                    <p className="text-sm text-ui-text-light">{request.user.email}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-ui-text-dark mb-1">
                    Requesting: <span className="text-logo-primary-blue">{request.requested_role}</span>
                  </p>
                  <p className="text-sm text-ui-text-light">{request.reason}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-ui-text-light">
                  <span>Requested: {new Date(request.created_at).toLocaleDateString()}</span>
                  {request.reviewed_at && (
                    <span>Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              {request.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {roleRequests.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-ui-text-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ui-text-dark mb-2">No Role Requests</h3>
            <p className="text-ui-text-light">No pending role change requests at this time.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
