import React, { useState, useEffect } from 'react';
import { studentStatusService } from '../../../services/studentStatusService';
import { StudentStatus } from '../../../types/studentStatus';

interface Props {
  status: StudentStatus;
}

export default function StudentList({ status }: Props) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadStudents();
  }, [status, page]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentStatusService.getStudentsByStatus(status, 20, page * 20);
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div className="student-list">
      {students.length === 0 ? (
        <div className="empty-state">No students found</div>
      ) : (
        <>
          <table className="students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Matric Number</th>
                <th>Department</th>
                <th>Programme</th>
                <th>Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.firstName} {student.lastName}</td>
                  <td className="mat-number">{student.matNumber}</td>
                  <td>{student.department?.name}</td>
                  <td>{student.programme?.name}</td>
                  <td>{student.currentLevel}</td>
                  <td>
                    <span className={`status-badge status-${student.status.toLowerCase()}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-icon" title="View Details">👁️</button>
                    <button className="btn-icon" title="Edit">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button onClick={() => setPage(page + 1)} disabled={students.length < 20}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
