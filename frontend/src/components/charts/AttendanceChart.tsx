'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { api } from '@/lib/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AttendanceStats {
  total_attendance: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_percentage: number;
}

interface AttendanceChartProps {
  days?: number;
  studentId?: string;
  courseId?: string;
}

export default function AttendanceChart({ days = 30, studentId, courseId }: AttendanceChartProps) {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendanceStats();
  }, [days, studentId, courseId]);

  const loadAttendanceStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { days };
      if (studentId) params.student_id = studentId;
      if (courseId) params.course_id = courseId;
      
      const data = await api.getAttendanceStats(params);
      setStats(data);
    } catch (err) {
      console.error('Error loading attendance stats:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-72 bg-ui-background flex items-center justify-center rounded-lg border border-ui-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-72 bg-ui-background flex items-center justify-center rounded-lg border border-ui-border">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-sm text-ui-text-light">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_attendance === 0) {
    return (
      <div className="h-72 bg-ui-background flex items-center justify-center rounded-lg border border-ui-border">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2 text-ui-text-light">No Attendance Data</p>
          <p className="text-sm text-ui-text-light">
            No attendance records found for the selected period.
          </p>
        </div>
      </div>
    );
  }

  // Bar chart data for daily trends (simplified - showing status breakdown)
  const barChartData = {
    labels: ['Present', 'Absent', 'Late', 'Excused'],
    datasets: [
      {
        label: 'Attendance Count',
        data: [stats.present_count, stats.absent_count, stats.late_count, stats.excused_count],
        backgroundColor: [
          '#10B981', // Green for present
          '#EF4444', // Red for absent
          '#F59E0B', // Orange for late
          '#6B7280', // Gray for excused
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#D97706',
          '#4B5563',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Doughnut chart data for overall distribution
  const doughnutData = {
    labels: ['Present', 'Absent', 'Late', 'Excused'],
    datasets: [
      {
        data: [stats.present_count, stats.absent_count, stats.late_count, stats.excused_count],
        backgroundColor: [
          '#10B981',
          '#EF4444',
          '#F59E0B',
          '#6B7280',
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#D97706',
          '#4B5563',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed.y || context.parsed;
            const percentage = stats.total_attendance > 0 
              ? ((value / stats.total_attendance) * 100).toFixed(1)
              : '0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = stats.total_attendance > 0 
              ? ((value / stats.total_attendance) * 100).toFixed(1)
              : '0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xl md:text-2xl font-bold text-green-600">{stats.present_count}</p>
          <p className="text-xs md:text-sm text-green-700">Present</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xl md:text-2xl font-bold text-red-600">{stats.absent_count}</p>
          <p className="text-xs md:text-sm text-red-700">Absent</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.late_count}</p>
          <p className="text-xs md:text-sm text-orange-700">Late</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xl md:text-2xl font-bold text-gray-600">{stats.excused_count}</p>
          <p className="text-xs md:text-sm text-gray-700">Excused</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="h-72 pb-4">
          <h3 className="text-lg font-semibold mb-4 text-ui-text-dark">Attendance Breakdown</h3>
          <div className="h-56">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="h-72 pb-4">
          <h3 className="text-lg font-semibold mb-4 text-ui-text-dark">Distribution</h3>
          <div className="h-56">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="mt-6 text-center p-4 bg-logo-primary-blue bg-opacity-5 rounded-lg">
        <p className="text-sm text-ui-text-light mb-1">Overall Attendance Rate</p>
        <p className="text-3xl font-bold text-logo-primary-blue">{stats.attendance_percentage}%</p>
        <p className="text-xs text-ui-text-light mt-1">
          {stats.total_attendance} total records over {days} days
        </p>
      </div>
    </div>
  );
}
