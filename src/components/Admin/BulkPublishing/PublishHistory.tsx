import React, { useState } from 'react';
import { BulkPublishOperation } from '../../../types/bulkPublishing';

interface Props {
  operations: BulkPublishOperation[];
}

export default function PublishHistory({ operations }: Props) {
  const [expandedOp, setExpandedOp] = useState<string | null>(null);

  return (
    <div className="publish-history">
      <h2>📋 Publishing History</h2>
      <p className="subtitle">View all bulk publishing operations</p>

      {operations.length === 0 ? (
        <div className="empty-state">
          <p>No publishing operations yet</p>
        </div>
      ) : (
        <div className="operations-list">
          {operations.map(op => (
            <div key={op.id} className="operation-card">
              <div className="operation-header" onClick={() => setExpandedOp(expandedOp === op.id ? null : op.id)}>
                <div className="operation-info">
                  <h3>{op.operationName}</h3>
                  <span className={`badge badge-${op.operationType.toLowerCase()}`}>
                    {op.operationType}
                  </span>
                  <span className={`status status-${op.status.toLowerCase()}`}>
                    {op.status}
                  </span>
                </div>
                <div className="operation-stats">
                  <span className="stat">{op.publishedRecords}/{op.totalRecords} published</span>
                  <span className="date">{new Date(op.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {expandedOp === op.id && (
                <div className="operation-details">
                  <div className="detail-row">
                    <span className="label">Operation Type:</span>
                    <span className="value">{op.operationType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`status status-${op.status.toLowerCase()}`}>{op.status}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Records:</span>
                    <span className="value">{op.publishedRecords}/{op.totalRecords} Published | {op.failedRecords} Failed</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Started:</span>
                    <span className="value">{new Date(op.startedAt).toLocaleString()}</span>
                  </div>
                  {op.completedAt && (
                    <div className="detail-row">
                      <span className="label">Completed:</span>
                      <span className="value">{new Date(op.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
