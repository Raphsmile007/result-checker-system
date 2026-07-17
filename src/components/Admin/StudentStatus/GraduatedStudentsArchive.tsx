import React, { useState, useEffect } from 'react';
import { studentStatusService } from '../../../services/studentStatusService';

export default function GraduatedStudentsArchive() {
  const [graduates, setGraduates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadGraduates();
  }, [page]);

  const loadGraduates = async () => {
    try {
      setLoading(true);
      const data = await studentStatusService.getGraduatedStudents(20, page * 20);
      setGraduates(data || []);
    } catch (error) {
      console.error('Error loading graduates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGraduates = graduates.filter(g => {
    const matchesSearch =
      g.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.matNumber.includes(searchQuery);

    const matchesYear = !filterYear || (g.graduation_session && g.graduation_session.startsWith(filterYear));

    return matchesSearch && matchesYear;
  });

  return (
    <div className="graduated-archive">
      <div className="archive-header">
        <h2>🎓 Graduated Students & Alumni Archive</h2>
        <p>Complete academic history and records of all graduated students</p>
      </div>

      <div className="archive-filters">
        <input
          type="text"
          placeholder="Search by name, matric number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          className="filter-select"
        >
          <option value="">All Years</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading alumni records...</div>
      ) : (
        <>
          <div className="archive-stats">
            <span>Total Graduates: <strong>{filteredGraduates.length}</strong></span>
          </div>

          <table className="graduates-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Matric Number</th>
                <th>Department</th>
                <th>Programme</th>
                <th>Graduation Year</th>
                <th>CGPA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGraduates.map(grad => (
                <tr key={grad.id}>
                  <td>{grad.firstName} {grad.lastName}</td>
                  <td className="mat-number">{grad.matNumber}</td>
                  <td>{grad.department?.name}</td>
                  <td>{grad.programme?.name}</td>
                  <td>{grad.graduation_session}</td>
                  <td className="cgpa">{grad.graduation_cgpa?.toFixed(2) || 'N/A'}</td>
                  <td className="actions">
                    <button className="btn-icon" title="View Transcript">📄</button>
                    <button className="btn-icon" title="Print Certificate">🖨️</button>
                    <button className="btn-icon" title="Verify Record">✓</button>
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
            <button onClick={() => setPage(page + 1)} disabled={graduates.length < 20}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
