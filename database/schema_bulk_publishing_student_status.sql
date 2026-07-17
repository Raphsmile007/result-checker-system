-- ============================================
-- BULK PUBLISHING SCHEMA
-- ============================================

-- Bulk Publishing Operations Table
CREATE TABLE IF NOT EXISTS bulk_publish_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(50) NOT NULL, -- COURSE, DEPARTMENT, LEVEL, SEMESTER, SESSION, ALL
  publish_scope JSONB NOT NULL, -- stores filters {course_id, department_id, level, semester, session}
  total_records INT NOT NULL,
  published_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  initiated_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bulk Publishing Details Table
CREATE TABLE IF NOT EXISTS bulk_publish_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES bulk_publish_operations(id) ON DELETE CASCADE,
  result_id UUID NOT NULL REFERENCES results(id),
  student_id UUID NOT NULL REFERENCES students(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PUBLISHED, FAILED
  error_message TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Result Publishing Audit Log
CREATE TABLE IF NOT EXISTS result_publish_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES results(id),
  operation_id UUID REFERENCES bulk_publish_operations(id),
  previous_state VARCHAR(50),
  new_state VARCHAR(50),
  published_by UUID NOT NULL REFERENCES admin_users(id),
  publish_timestamp TIMESTAMP DEFAULT NOW(),
  is_unpublished BOOLEAN DEFAULT FALSE,
  unpublished_by UUID REFERENCES admin_users(id),
  unpublish_timestamp TIMESTAMP,
  unpublish_reason TEXT
);

-- Bulk Publishing Preview Cache
CREATE TABLE IF NOT EXISTS bulk_publish_preview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  operation_type VARCHAR(50),
  publish_scope JSONB,
  preview_data JSONB, -- Stores preview results
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 minutes'
);

-- ============================================
-- STUDENT STATUS MANAGEMENT SCHEMA
-- ============================================

-- Add columns to existing students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_session VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_date TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_cgpa DECIMAL(3,2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_alumni BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_record_locked BOOLEAN DEFAULT FALSE;

-- Student Status History Table
CREATE TABLE IF NOT EXISTS student_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  previous_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES admin_users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Graduation Requirements Table
CREATE TABLE IF NOT EXISTS graduation_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id UUID NOT NULL REFERENCES programmes(id),
  level VARCHAR(20), -- 'ND', 'HND'
  min_cgpa DECIMAL(3,2) NOT NULL,
  min_credit_units INT NOT NULL,
  required_courses INT NOT NULL,
  other_requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Graduations Table (Audit Trail)
CREATE TABLE IF NOT EXISTS student_graduations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  graduation_session VARCHAR(20) NOT NULL,
  graduation_date TIMESTAMP DEFAULT NOW(),
  cgpa_at_graduation DECIMAL(3,2) NOT NULL,
  total_credit_units INT NOT NULL,
  programme_completed VARCHAR(50), -- 'ND', 'HND', 'COMBINED'
  graduation_processed_by UUID NOT NULL REFERENCES admin_users(id),
  is_automatic BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_graduation_session ON students(graduation_session);
CREATE INDEX IF NOT EXISTS idx_bulk_publish_status ON bulk_publish_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_publish_details_operation ON bulk_publish_details(operation_id);
CREATE INDEX IF NOT EXISTS idx_result_publish_audit_result ON result_publish_audit(result_id);
CREATE INDEX IF NOT EXISTS idx_student_status_history_student ON student_status_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_graduations_session ON student_graduations(graduation_session);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================

-- Sample Graduation Requirements (insert after ensuring programmes exist)
-- INSERT INTO graduation_requirements (programme_id, level, min_cgpa, min_credit_units, required_courses)
-- VALUES ('programme-id', 'ND', 2.0, 60, 40);

-- ============================================
-- VIEWS FOR EASIER QUERIES
-- ============================================

-- Active Students View
CREATE OR REPLACE VIEW active_students_view AS
SELECT 
  s.id,
  s.firstName,
  s.lastName,
  s.matNumber,
  s.email,
  s.status,
  d.name as department,
  p.name as programme,
  s.currentLevel as current_level
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
LEFT JOIN programmes p ON s.programme_id = p.id
WHERE s.status = 'ACTIVE'
ORDER BY s.firstName, s.lastName;

-- Graduated Students View
CREATE OR REPLACE VIEW graduated_students_view AS
SELECT 
  s.id,
  s.firstName,
  s.lastName,
  s.matNumber,
  s.email,
  s.graduation_session,
  s.graduation_date,
  s.graduation_cgpa,
  d.name as department,
  p.name as programme,
  sg.programme_completed
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
LEFT JOIN programmes p ON s.programme_id = p.id
LEFT JOIN student_graduations sg ON s.id = sg.student_id
WHERE s.status = 'GRADUATED'
ORDER BY s.graduation_session DESC, s.firstName, s.lastName;

-- Publishing Operations Summary View
CREATE OR REPLACE VIEW publishing_operations_summary_view AS
SELECT 
  bpo.id,
  bpo.operation_name,
  bpo.operation_type,
  bpo.status,
  bpo.total_records,
  bpo.published_records,
  bpo.failed_records,
  ROUND((bpo.published_records::DECIMAL / NULLIF(bpo.total_records, 0)) * 100, 2) as success_percentage,
  bpo.started_at,
  bpo.completed_at,
  au.email as initiated_by_email
FROM bulk_publish_operations bpo
LEFT JOIN admin_users au ON bpo.initiated_by = au.id
ORDER BY bpo.created_at DESC;

-- Student Status Distribution View
CREATE OR REPLACE VIEW student_status_distribution_view AS
SELECT 
  status,
  COUNT(*) as total_students,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM students)), 2) as percentage
FROM students
GROUP BY status
ORDER BY total_students DESC;
