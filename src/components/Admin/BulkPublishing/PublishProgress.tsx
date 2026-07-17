import React, { useState, useEffect } from 'react';
import { bulkPublishingService } from '../../../services/bulkPublishingService';
import { BulkPublishOperation } from '../../../types/bulkPublishing';

interface Props {
  operation: BulkPublishOperation;
}

export default function PublishProgress({ operation }: Props) {
  const [progress, setProgress] = useState(operation);
  const [logs, setLogs] = useState<string[]>([
    `✓ Operation initialized: ${operation.operationName}`,
    `📊 Total records to publish: ${operation.totalRecords}`,
  ]);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const updated = await bulkPublishingService.getOperationProgress(operation.id);
        setProgress(updated.operation);

        // Add log entries
        const newPublished = updated.operation.published_records;
        if (newPublished > progress.published_records) {
          setLogs(prev => [...prev, `✓ Published ${newPublished} / ${operation.totalRecords} results`]);
        }

        if (updated.operation.status === 'COMPLETED') {
          setLogs(prev => [...prev, `✅ Operation completed successfully`]);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [operation.id, progress.published_records]);

  const progressPercentage = progress.total_records > 0 
    ? (progress.published_records / progress.total_records) * 100 
    : 0;

  return (
    <div className="publish-progress">
      <div className="progress-header">
        <h2>{progress.operation_name}</h2>
        <span className={`status-badge status-${progress.status.toLowerCase()}`}>
          {progress.status}
        </span>
      </div>

      <div className="progress-stats">
        <div className="stat">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{progress.total_records}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Published</div>
          <div className="stat-value success">{progress.published_records}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Failed</div>
          <div className="stat-value error">{progress.failed_records}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Remaining</div>
          <div className="stat-value warning">
            {progress.total_records - progress.published_records - progress.failed_records}
          </div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-text">{Math.round(progressPercentage)}% Complete</div>
      </div>

      <div className="progress-logs">
        <h3>📋 Activity Log</h3>
        <div className="logs-container">
          {logs.map((log, idx) => (
            <div key={idx} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
