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
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, DollarSign, Briefcase, TrendingUp, Users } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface EmploymentStats {
  total_students: number;
  working_count: number;
  employment_rate: number;
  avg_salary: number;
  salary_stats: {
    avg: number;
    min: number;
    max: number;
  };
  job_categories: Record<string, number>;
  status_breakdown: {
    Working: number;
    'Not Working': number;
  };
  improvement_stats: {
    students_with_data: number;
    avg_improvement: number;
    avg_improvement_percent: number;
  };
}

const visualizations = [
  { id: 'employment', name: 'Employment Rate' },
  { id: 'salary', name: 'Average Salary' },
  { id: 'job-categories', name: 'Job Categories' },
  { id: 'salary-improvement', name: 'Salary Improvement' },
  { id: 'attendance', name: 'Attendance Overview' },
];

export default function ImpactVisualizations() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [employmentStats, setEmploymentStats] = useState<EmploymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empStats, attStats] = await Promise.all([
        api.getEmploymentStats(),
        api.getAttendanceStats({ days: 30 }),
      ]);
      setEmploymentStats(empStats as EmploymentStats);
      setAttendanceStats(attStats);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % visualizations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + visualizations.length) % visualizations.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="h-96 bg-ui-background flex items-center justify-center rounded-lg border border-ui-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-logo-primary-blue mx-auto mb-4"></div>
          <p className="text-ui-text-light">Loading impact data...</p>
        </div>
      </div>
    );
  }

  const renderVisualization = () => {
    const currentViz = visualizations[currentIndex].id;

    switch (currentViz) {
      case 'attendance':
        return renderAttendanceChart();
      case 'employment':
        return renderEmploymentRate();
      case 'salary':
        return renderAverageSalary();
      case 'job-categories':
        return renderJobCategories();
      case 'salary-improvement':
        return renderSalaryImprovement();
      default:
        return null;
    }
  };

  const renderAttendanceChart = () => {
    if (!attendanceStats || attendanceStats.total_attendance === 0) {
      return (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-lg font-semibold text-ui-text-dark mb-2">No attendance data available</p>
          <p className="text-sm text-ui-text-light max-w-md">
            Start marking attendance to see trends and insights here. Use the "Mark Attendance" button to get started.
          </p>
        </div>
      );
    }

    const barChartData = {
      labels: ['Present', 'Absent', 'Late', 'Excused'],
      datasets: [
        {
          label: 'Attendance',
          data: [
            attendanceStats.present_count || 0,
            attendanceStats.absent_count || 0,
            attendanceStats.late_count || 0,
            attendanceStats.excused_count || 0,
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(107, 114, 128, 0.8)',
          ],
        },
      ],
    };

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-ui-text-dark mb-2">Attendance Overview (Last 30 Days)</h3>
          <p className="text-3xl font-bold text-logo-primary-blue">
            {attendanceStats.attendance_percentage?.toFixed(1) || 0}%
          </p>
          <p className="text-sm text-ui-text-light">Overall Attendance Rate</p>
        </div>
        <div className="h-64">
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const total = attendanceStats.total_attendance;
                      const value = context.parsed.y;
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                      return `${context.label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderEmploymentRate = () => {
    if (!employmentStats) return null;

    const data = {
      labels: ['Working', 'Not Working'],
      datasets: [
        {
          data: [
            employmentStats.status_breakdown.Working,
            employmentStats.status_breakdown['Not Working'],
          ],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        },
      ],
    };

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-logo-primary-blue mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-ui-text-dark mb-2">Employment Rate</h3>
          <p className="text-4xl font-bold text-logo-primary-blue">{employmentStats.employment_rate}%</p>
          <p className="text-sm text-ui-text-light">
            {employmentStats.working_count} of {employmentStats.total_students} students employed
          </p>
        </div>
        <div className="h-64">
          <Doughnut
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const total = employmentStats.total_students;
                      const value = context.parsed;
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                      return `${context.label}: ${value} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderAverageSalary = () => {
    if (!employmentStats) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-logo-primary-blue mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-ui-text-dark mb-2">Average Monthly Salary</h3>
          <p className="text-4xl font-bold text-logo-primary-blue">
            ₹{employmentStats.avg_salary.toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-ui-text-light mt-2">
            Based on {employmentStats.working_count} working students
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-ui-text-light mb-1">Minimum</p>
            <p className="text-xl font-bold text-green-600">
              ₹{employmentStats.salary_stats.min.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-ui-text-light mb-1">Average</p>
            <p className="text-xl font-bold text-blue-600">
              ₹{employmentStats.salary_stats.avg.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-ui-text-light mb-1">Maximum</p>
            <p className="text-xl font-bold text-purple-600">
              ₹{employmentStats.salary_stats.max.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderJobCategories = () => {
    if (!employmentStats || !employmentStats.job_categories) return null;

    const categories = Object.entries(employmentStats.job_categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(251, 146, 60, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(107, 114, 128, 0.8)',
    ];

    const data = {
      labels: categories.map(([name]) => name),
      datasets: [
        {
          label: 'Students',
          data: categories.map(([, count]) => count),
          backgroundColor: colors.slice(0, categories.length),
        },
      ],
    };

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-logo-primary-blue mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-ui-text-dark mb-2">Job Categories</h3>
          <p className="text-sm text-ui-text-light">Distribution of employment types</p>
        </div>
        <div className="h-64">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      return `${context.label}: ${context.parsed.x} students`;
                    },
                  },
                },
              },
              scales: {
                x: { beginAtZero: true },
              },
            }}
          />
        </div>
      </div>
    );
  };

  const renderSalaryImprovement = () => {
    if (!employmentStats || employmentStats.improvement_stats.students_with_data === 0) {
      return (
        <div className="h-72 flex items-center justify-center">
          <p className="text-ui-text-light">Insufficient data for salary improvement analysis</p>
        </div>
      );
    }

    const { improvement_stats } = employmentStats;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-logo-primary-blue mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-ui-text-dark mb-2">Salary Improvement</h3>
          <p className="text-4xl font-bold text-green-600">
            +{improvement_stats.avg_improvement_percent}%
          </p>
          <p className="text-sm text-ui-text-light mt-2">
            Average salary increase after Bloom program
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-ui-text-light mb-1">Average Increase</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{improvement_stats.avg_improvement.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-ui-text-light mt-1">per month</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-ui-text-light mb-1">Students Tracked</p>
            <p className="text-2xl font-bold text-green-600">
              {improvement_stats.students_with_data}
            </p>
            <p className="text-xs text-ui-text-light mt-1">with before/after data</p>
          </div>
        </div>
        <div className="text-center p-4 bg-logo-primary-blue bg-opacity-5 rounded-lg">
          <p className="text-sm text-ui-text-dark">
            This represents the positive impact of the Bloom program on student earnings
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Carousel Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevSlide}
          className="p-2 rounded-lg hover:bg-ui-background transition-colors"
          aria-label="Previous visualization"
        >
          <ChevronLeft className="w-5 h-5 text-ui-text-light" />
        </button>
        
        <div className="flex items-center gap-2">
          {visualizations.map((viz, index) => (
            <button
              key={viz.id}
              onClick={() => goToSlide(index)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                index === currentIndex
                  ? 'bg-logo-primary-blue text-white'
                  : 'bg-ui-background text-ui-text-light hover:bg-ui-border'
              }`}
            >
              {viz.name}
            </button>
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-2 rounded-lg hover:bg-ui-background transition-colors"
          aria-label="Next visualization"
        >
          <ChevronRight className="w-5 h-5 text-ui-text-light" />
        </button>
      </div>

      {/* Visualization Content */}
      <div className="min-h-[400px] p-6 bg-ui-background rounded-lg border border-ui-border">
        {renderVisualization()}
      </div>

      {/* Slide Indicators - Only show if there's data */}
      {(attendanceStats?.total_attendance > 0 || employmentStats) && (
        <div className="flex justify-center gap-2 mt-4">
          {visualizations.map((_, index) => {
            // Only show indicator if the visualization has data
            const hasData = 
              (index === 0 && attendanceStats?.total_attendance > 0) ||
              (index === 1 && employmentStats) ||
              (index === 2 && employmentStats) ||
              (index === 3 && employmentStats?.job_categories) ||
              (index === 4 && employmentStats?.improvement_stats?.students_with_data > 0);
            
            if (!hasData) return null;
            
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-logo-primary-blue'
                    : 'w-2 bg-ui-border hover:bg-ui-text-light'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

