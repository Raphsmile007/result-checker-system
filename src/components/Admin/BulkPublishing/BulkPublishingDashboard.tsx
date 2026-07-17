import React, { useState, useEffect } from 'react';
import { bulkPublishingService } from '../../../services/bulkPublishingService';
import { BulkPublishOperation } from '../../../types/bulkPublishing';
import PublishSelector from './PublishSelector';
import PublishProgress from './PublishProgress';
import PublishHistory from './PublishHistory';
import './bulkPublishing.css';

export default function BulkPublishingDashboard() {
  const [activeTab, setActiveTab] = useState<'publish' | 'progress' | 'history' | 'logs'>('publish');
  const [operations, setOperations] = useState<BulkPublishOperation[]>([]);
  const [currentOperation, setCurrentOperation] = useState<BulkPublishOperation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOperations();
    const interval = setInterval(loadOperations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOperations = async () => {
    try {
      const history = await bulkPublishingService.getOperationHistory(10);
      setOperations(history || []);
      if (currentOperation) {
        const updated = (history || []).find(op => op.id === currentOperation.id);
        if (updated) setCurrentOperation(updated);
      }
    } catch (error) {
      console.error('Error loading operations:', error);
    }
  };

  const handlePublishStart = (operation: BulkPublishOperation) => {
    setCurrentOperation(operation);
    setActiveTab('progress');
  };

  return (
    <div className="bulk-publishing-dashboard">
      <div className="dashboard-header">
        <h1>📦 Bulk Result Publishing</h1>
        <p>Publish results in bulk by course, department, level, semester, or entire session</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'publish' ? 'active' : ''}`}
          onClick={() => setActiveTab('publish')}
        >
          🚀 Publish Results
        </button>
        <button
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
          disabled={!currentOperation}
        >
          ⏳ Progress
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 History
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          🔍 Audit Logs
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'publish' && (
          <PublishSelector onOperationStart={handlePublishStart} />
        )}

        {activeTab === 'progress' && currentOperation && (
          <PublishProgress operation={currentOperation} />
        )}

        {activeTab === 'history' && (
          <PublishHistory operations={operations} />
        )}

        {activeTab === 'logs' && (
          <div className="audit-logs">
            <h2>📊 Audit Logs</h2>
            <p>Detailed logs of all bulk publishing operations</p>
          </div>
        )}
      </div>
    </div>
  );
}
