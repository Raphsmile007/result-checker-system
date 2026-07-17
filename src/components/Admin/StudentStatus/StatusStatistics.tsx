import React from 'react';
import { DashboardStatistics } from '../../../types/studentStatus';

interface Props {
  stats: DashboardStatistics;
}

export default function StatusStatistics({ stats }: Props) {
  const totalStudents = stats.activeStudents + stats.graduatedStudents + stats.deferredStudents + 
                       stats.suspendedStudents + stats.withdrawnStudents + stats.expelledStudents;

  const getPercentage = (value: number) => {
    return totalStudents > 0 ? ((value / totalStudents) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="status-statistics">
      <div className="statistics-header">
        <h2>📈 Student Status Statistics</h2>
        <p>Detailed breakdown of student distribution</p>
      </div>

      <div className="statistics-grid">
        <StatisticCard
          title="Active Students"
          value={stats.activeStudents}
          percentage={getPercentage(stats.activeStudents)}
          color="primary"
        />
        <StatisticCard
          title="Graduated"
          value={stats.graduatedStudents}
          percentage={getPercentage(stats.graduatedStudents)}
          color="success"
        />
        <StatisticCard
          title="Deferred"
          value={stats.deferredStudents}
          percentage={getPercentage(stats.deferredStudents)}
          color="warning"
        />
        <StatisticCard
          title="Suspended"
          value={stats.suspendedStudents}
          percentage={getPercentage(stats.suspendedStudents)}
          color="danger"
        />
        <StatisticCard
          title="Withdrawn"
          value={stats.withdrawnStudents}
          percentage={getPercentage(stats.withdrawnStudents)}
          color="secondary"
        />
        <StatisticCard
          title="Expelled"
          value={stats.expelledStudents}
          percentage={getPercentage(stats.expelledStudents)}
          color="error"
        />
      </div>

      <div className="statistics-summary">
        <div className="summary-card">
          <h3>Summary</h3>
          <div className="summary-item">
            <span>Total Students:</span>
            <strong>{totalStudents}</strong>
          </div>
          <div className="summary-item">
            <span>Published Results:</span>
            <strong>{stats.publishedResults}</strong>
          </div>
          <div className="summary-item">
            <span>Pending Results:</span>
            <strong>{stats.pendingResults}</strong>
          </div>
          <div className="summary-item">
            <span>Alumni Count:</span>
            <strong>{stats.alumniCount}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatisticCard({ title, value, percentage, color }: any) {
  return (
    <div className={`statistic-card stat-${color}`}>
      <h4>{title}</h4>
      <div className="card-value">{value}</div>
      <div className="card-percentage">{percentage}%</div>
    </div>
  );
}
