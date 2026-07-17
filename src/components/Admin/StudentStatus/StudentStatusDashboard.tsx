import React, { useState, useEffect } from 'react';
import { studentStatusService } from '../../../services/studentStatusService';
import { DashboardStatistics } from '../../../types/studentStatus';
import StudentList from './StudentList';
import GraduatedStudentsArchive from './GraduatedStudentsArchive';
import StatusStatistics from './StatusStatistics';
import './studentStatus.css';

export default function StudentStatusDashboard() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'graduated' | 'statistics' | 'other'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashStats = await studentStatusService.getDashboardStatistics();
      setStats(dashStats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading student statistics...</div>;
  if (!stats) return <div className="error">Error loading statistics</div>;

  return (
    <div className="student-status-dashboard">
      <div className="dashboard-header">
        <h1>👥 Student Status Management</h1>
        <p>Monitor and manage student records across all statuses</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon="🎓"
          label="Active Students"
          value={stats.activeStudents}
          color="primary"
          onClick={() => setActiveTab('active')}
        />
        <StatCard
          icon="✅"
          label="Graduated"
          value={stats.graduatedStudents}
          color="success"
          onClick={() => setActiveTab('graduated')}
        />
        <StatCard
          icon="📚"
          label="Alumni"
          value={stats.alumniCount}
          color="info"
          onClick={() => setActiveTab('graduated')}
        />
        <StatCard
          icon="⏸️"
          label="Deferred"
          value={stats.deferredStudents}
          color="warning"
          onClick={() => setActiveTab('other')}
        />
        <StatCard
          icon="🚫"
          label="Suspended"
          value={stats.suspendedStudents}
          color="danger"
          onClick={() => setActiveTab('other')}
        />
        <StatCard
          icon="❌"
          label="Withdrawn"
          value={stats.withdrawnStudents}
          color="secondary"
          onClick={() => setActiveTab('other')}
        />
        <StatCard
          icon="📋"
          label="Results Published"
          value={stats.publishedResults}
          color="primary"
        />
        <StatCard
          icon="⏳"
          label="Pending Results"
          value={stats.pendingResults}
          color="warning"
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🎓 Active Students
        </button>
        <button
          className={`tab ${activeTab === 'graduated' ? 'active' : ''}`}
          onClick={() => setActiveTab('graduated')}
        >
          ✅ Graduated/Alumni
        </button>
        <button
          className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📈 Statistics
        </button>
        <button
          className={`tab ${activeTab === 'other' ? 'active' : ''}`}
          onClick={() => setActiveTab('other')}
        >
          🔧 Other Status
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <DashboardOverview stats={stats} />
        )}

        {activeTab === 'active' && (
          <StudentList status="ACTIVE" />
        )}

        {activeTab === 'graduated' && (
          <GraduatedStudentsArchive />
        )}

        {activeTab === 'statistics' && (
          <StatusStatistics stats={stats} />
        )}

        {activeTab === 'other' && (
          <OtherStatusList />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color, onClick }: any) {
  return (
    <div
      className={`stat-card stat-${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-details">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

// Dashboard Overview
function DashboardOverview({ stats }: any) {
  return (
    <div className="overview-section">
      <div className="overview-grid">
        <div className="overview-card">
          <h3>Student Distribution</h3>
          <div className="distribution-stats">
            <div className="dist-item">
              <span>Active</span>
              <strong>{stats.activeStudents}</strong>
            </div>
            <div className="dist-item">
              <span>Graduated</span>
              <strong>{stats.graduatedStudents}</strong>
            </div>
            <div className="dist-item">
              <span>Other</span>
              <strong>
                {stats.deferredStudents + stats.suspendedStudents + stats.withdrawnStudents + stats.expelledStudents}
              </strong>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Result Publishing Status</h3>
          <div className="result-stats">
            <div className="result-item">
              <span>Published</span>
              <strong>{stats.publishedResults}</strong>
            </div>
            <div className="result-item">
              <span>Pending Approval</span>
              <strong>{stats.pendingResults}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Other Status List
function OtherStatusList() {
  const statuses = ['DEFERRED', 'SUSPENDED', 'WITHDRAWN', 'EXPELLED'];

  return (
    <div className="other-status-list">
      <div className="status-tabs">
        {statuses.map(status => (
          <div key={status} className="status-section">
            <h3>{status}</h3>
            <StudentList status={status as any} />
          </div>
        ))}
      </div>
    </div>
  );
}
