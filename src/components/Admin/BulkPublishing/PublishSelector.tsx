import React, { useState } from 'react';
import { bulkPublishingService } from '../../../services/bulkPublishingService';
import { BulkPublishOperation, BulkPublishScope } from '../../../types/bulkPublishing';

interface Props {
  onOperationStart: (operation: BulkPublishOperation) => void;
}

export default function PublishSelector({ onOperationStart }: Props) {
  const [publishType, setPublishType] = useState<'COURSE' | 'DEPARTMENT' | 'LEVEL' | 'SEMESTER' | 'SESSION' | 'ALL'>('COURSE');
  const [filters, setFilters] = useState<BulkPublishScope>({});
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bulkPublishingService.generatePublishPreview(
        publishType,
        filters,
        'admin-user-id'
      );
      setPreviewData(data);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Error generating preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Publish ${previewData.length} results? This action cannot be easily reversed.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const operation = await bulkPublishingService.publishResults(
        `Bulk Publish - ${publishType}`,
        publishType,
        filters,
        'admin-user-id'
      );
      onOperationStart(operation);
    } catch (err: any) {
      setError(err.message || 'Error publishing results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-selector">
      <div className="selector-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label>Publish By</label>
          <div className="publish-options">
            {(['COURSE', 'DEPARTMENT', 'LEVEL', 'SEMESTER', 'SESSION', 'ALL'] as const).map(type => (
              <button
                key={type}
                className={`option-btn ${publishType === type ? 'active' : ''}`}
                onClick={() => {
                  setPublishType(type);
                  setFilters({});
                  setShowPreview(false);
                }}
              >
                {type === 'COURSE' && '📚 Course'}
                {type === 'DEPARTMENT' && '🏢 Department'}
                {type === 'LEVEL' && '📊 Level'}
                {type === 'SEMESTER' && '📅 Semester'}
                {type === 'SESSION' && '🎓 Session'}
                {type === 'ALL' && '⭐ All Results'}
              </button>
            ))}
          </div>
        </div>

        {publishType !== 'ALL' && (
          <PublishFilterForm
            type={publishType}
            filters={filters}
            onChange={setFilters}
          />
        )}

        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? '⏳ Generating Preview...' : '👁️ Preview Results'}
          </button>
          {showPreview && previewData.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={loading}
            >
              ✓ Publish {previewData.length} Results
            </button>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="preview-results">
          <h3>Preview - {previewData.length} Results to Publish</h3>
          <table className="preview-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Matric Number</th>
                <th>Course</th>
                <th>Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.studentName}</td>
                  <td className="mono">{row.matNumber}</td>
                  <td>{row.courseCode} - {row.courseTitle}</td>
                  <td className="score">{row.score}</td>
                  <td className="grade">{row.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewData.length > 10 && (
            <p className="more-info">... and {previewData.length - 10} more results</p>
          )}
        </div>
      )}
    </div>
  );
}

function PublishFilterForm({ type, filters, onChange }: any) {
  const handleChange = (key: string, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filter-form">
      {type === 'COURSE' && (
        <div className="form-group">
          <label>Select Course</label>
          <select
            value={filters.courseId || ''}
            onChange={e => handleChange('courseId', e.target.value)}
          >
            <option value="">-- Choose Course --</option>
            <option value="course1">CS101 - Programming</option>
            <option value="course2">CS102 - Database</option>
          </select>
        </div>
      )}

      {type === 'DEPARTMENT' && (
        <div className="form-group">
          <label>Select Department</label>
          <select
            value={filters.departmentId || ''}
            onChange={e => handleChange('departmentId', e.target.value)}
          >
            <option value="">-- Choose Department --</option>
            <option value="cs">Computer Science</option>
            <option value="eng">Engineering</option>
          </select>
        </div>
      )}

      {type === 'LEVEL' && (
        <div className="form-group">
          <label>Select Level</label>
          <select
            value={filters.level || ''}
            onChange={e => handleChange('level', e.target.value)}
          >
            <option value="">-- Choose Level --</option>
            <option value="ND I">ND I</option>
            <option value="ND II">ND II</option>
            <option value="HND I">HND I</option>
            <option value="HND II">HND II</option>
          </select>
        </div>
      )}

      {(type === 'SEMESTER' || type === 'SESSION') && (
        <>
          <div className="form-group">
            <label>Academic Session</label>
            <input
              type="text"
              placeholder="e.g., 2023/2024"
              value={filters.session || ''}
              onChange={e => handleChange('session', e.target.value)}
            />
          </div>
          {type === 'SEMESTER' && (
            <div className="form-group">
              <label>Semester</label>
              <select
                value={filters.semester || ''}
                onChange={e => handleChange('semester', e.target.value)}
              >
                <option value="">-- Choose Semester --</option>
                <option value="1">First Semester</option>
                <option value="2">Second Semester</option>
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
