# Bulk Publishing & Student Status Management - Implementation Guide

## Overview

This feature adds comprehensive bulk result publishing and student status management capabilities to the Interlink Polytechnic result checker system.

## Features Implemented

### 1. Bulk Result Publishing

#### Publishing Scopes
- **Course**: Publish results for a specific course
- **Department**: Publish results for all students in a department
- **Level**: Publish results for a specific academic level (ND I, ND II, HND I, HND II)
- **Semester**: Publish results for a specific semester in an academic session
- **Session**: Publish all results for an entire academic session
- **All**: Publish all approved results with a single click

#### Key Features
- **Preview Before Publishing**: Review all records that will be published
- **Real-time Progress Tracking**: Live progress bar and activity logs
- **Error Handling**: Individual record failure tracking without stopping the operation
- **Bulk Unpublishing**: Super Admin can unpublish results when necessary
- **Detailed Audit Logs**: Complete tracking of who published what and when
- **Operation History**: View all past publishing operations

#### Database Tables
- `bulk_publish_operations`: Tracks overall operation status
- `bulk_publish_details`: Tracks individual result publishing status
- `result_publish_audit`: Audit trail of all publish/unpublish actions
- `bulk_publish_preview`: Preview cache (expires after 30 minutes)

### 2. Student Status Management

#### Student Statuses
- **ACTIVE**: Currently enrolled students
- **GRADUATED**: Successfully completed program
- **DEFERRED**: Academic deferment
- **SUSPENDED**: Temporary suspension
- **WITHDRAWN**: Permanently withdrawn
- **EXPELLED**: Expelled students
- **ALUMNI**: Archived graduated students

#### Automatic Graduation

The system automatically processes graduation when students meet ALL requirements:
- Minimum CGPA requirement
- Minimum credit units requirement
- All required courses completed
- All results approved and published

**Automatic Graduation Process:**
1. Checks graduation requirements
2. Verifies student meets all criteria
3. Updates student status to GRADUATED
4. Locks academic records
5. Records graduation date and CGPA
6. Creates graduation audit entry
7. Marks student as Alumni

#### Alumni Management

- Separate archive for graduated/alumni students
- Search by: Name, Matric Number, Department, Programme, Year
- Actions: View Transcript, Print Certificate, Verify Records
- Data retention: Permanent record keeping

#### Dashboard Statistics

- Active Students Count
- Graduated Students Count
- Alumni Count
- Deferred Students Count
- Suspended Students Count
- Withdrawn Students Count
- Expelled Students Count
- Published Results Count
- Pending Results Count

## File Structure

```
src/
├── types/
│   ├── bulkPublishing.ts           # Bulk publishing types
│   └── studentStatus.ts            # Student status types
│
├── services/
│   ├── bulkPublishingService.ts     # Bulk publishing business logic
│   └── studentStatusService.ts      # Student status management logic
│
├── components/
│   └── Admin/
│       ├── BulkPublishing/
│       │   ├── BulkPublishingDashboard.tsx
│       │   ├── PublishSelector.tsx
│       │   ├── PublishProgress.tsx
│       │   ├── PublishHistory.tsx
│       │   └── bulkPublishing.css
│       │
│       └── StudentStatus/
│           ├── StudentStatusDashboard.tsx
│           ├── StudentList.tsx
│           ├── GraduatedStudentsArchive.tsx
│           ├── StatusStatistics.tsx
│           └── studentStatus.css
│
database/
└── schema_bulk_publishing_student_status.sql
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

The following dependencies are already included:
- `html2pdf.js`: For PDF generation
- `qrcode`: For QR code generation
- React, TypeScript, Supabase

### 2. Database Setup

Run the SQL schema file in Supabase SQL Editor:

```bash
# Copy contents of database/schema_bulk_publishing_student_status.sql
# Paste into Supabase SQL Editor and execute
```

This creates:
- 5 new tables
- 7 indexes for performance
- 3 views for easier querying

### 3. Environment Variables

Add to `.env` if needed:

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 4. Import Components

In your main application (e.g., `src/main.tsx` or routing config):

```typescript
import BulkPublishingDashboard from './components/Admin/BulkPublishing/BulkPublishingDashboard';
import StudentStatusDashboard from './components/Admin/StudentStatus/StudentStatusDashboard';

// Add to routes
<Route path="/admin/bulk-publishing" element={<BulkPublishingDashboard />} />
<Route path="/admin/student-status" element={<StudentStatusDashboard />} />
```

## Usage Guide

### Bulk Publishing

1. Navigate to Admin → Bulk Result Publishing
2. Select publishing scope (Course, Department, Level, Semester, Session, or All)
3. Apply filters if needed
4. Click "Preview Results" to see what will be published
5. Review the preview and click "Publish" to start
6. Monitor real-time progress
7. View operation history for audit trail

### Student Status Management

1. Navigate to Admin → Student Status Management
2. View quick statistics on dashboard
3. Click on any status card to view that group
4. Use filters to search students
5. For graduated students:
   - Access separate Alumni Archive
   - Search by graduation year
   - View complete academic records
   - Generate transcripts and certificates

### Automatic Graduation

The system automatically checks graduation eligibility when:
- New results are published
- Student GPA is updated
- Student status is reviewed

No manual action required - the system handles it automatically.

## Key Services

### bulkPublishingService

```typescript
// Generate preview before publishing
await bulkPublishingService.generatePublishPreview(type, scope, adminId);

// Start bulk publishing operation
await bulkPublishingService.publishResults(name, type, scope, adminId);

// Monitor progress
await bulkPublishingService.getOperationProgress(operationId);

// Unpublish results (Super Admin only)
await bulkPublishingService.unpublishResults(operationId, reason, superAdminId);

// View history
await bulkPublishingService.getOperationHistory(limit, offset);
```

### studentStatusService

```typescript
// Update student status
await studentStatusService.updateStudentStatus(studentId, newStatus, reason, adminId);

// Get students by status
await studentStatusService.getStudentsByStatus(status, limit, offset);

// Check and process graduation
await studentStatusService.checkAndProcessGraduation(studentId, adminId);

// Get dashboard statistics
await studentStatusService.getDashboardStatistics();

// Search students
await studentStatusService.searchStudents(query, status, department, limit);
```

## Database Queries

### Get Active Students
```sql
SELECT * FROM active_students_view;
```

### Get Graduated Students
```sql
SELECT * FROM graduated_students_view WHERE graduation_session = '2024/2025';
```

### View Publishing Operations
```sql
SELECT * FROM publishing_operations_summary_view ORDER BY started_at DESC;
```

### Student Status Distribution
```sql
SELECT * FROM student_status_distribution_view;
```

## Security Considerations

1. **Role-Based Access**
   - Admin: Can publish results by course, department, level, semester
   - Super Admin: Can also unpublish results
   - Registrar: Can manage graduation requirements

2. **Academic Record Locking**
   - Graduated student records are locked
   - Only Registrar/Super Admin can make corrections
   - All changes are audited

3. **Audit Trail**
   - Every publish/unpublish action is logged
   - Includes: who, what, when, and why
   - Cannot be modified or deleted

4. **Data Retention**
   - Student records never deleted
   - Graduation data permanently retained
   - Complete academic history preserved

## Performance Optimization

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Pagination**: Large datasets use pagination (20 records per page)
3. **Caching**: Preview data cached for 30 minutes
4. **Batch Processing**: Results published in batches
5. **Lazy Loading**: Components load data on demand

## Error Handling

- **Preview Generation**: Shows detailed preview with validation
- **Publishing Errors**: Individual record failures don't stop operation
- **Graduation Checks**: Fails gracefully if requirements not met
- **Network Errors**: Automatic retry with exponential backoff

## Troubleshooting

### Preview shows no results
- Check if results have APPROVED status
- Verify filters are correct
- Ensure academic session is valid

### Publishing completes but records show failed
- Check error_message in bulk_publish_details table
- Verify result data integrity
- Check user permissions

### Automatic graduation not triggered
- Verify graduation requirements are set
- Check that CGPA is calculated correctly
- Ensure all results are published
- Review student_status_history for details

## API Reference

### Bulk Publishing Endpoints

**Generate Preview**
```typescript
POST /api/bulk-publishing/preview
Body: { operationType, publishScope, adminUserId }
Returns: PublishPreviewData[]
```

**Start Publishing**
```typescript
POST /api/bulk-publishing/publish
Body: { operationName, operationType, publishScope, adminUserId }
Returns: BulkPublishOperation
```

**Get Progress**
```typescript
GET /api/bulk-publishing/progress/:operationId
Returns: { operation, details, progressPercentage }
```

**Unpublish Results**
```typescript
POST /api/bulk-publishing/unpublish/:operationId
Body: { reason, superAdminId }
Returns: void
```

### Student Status Endpoints

**Get Dashboard Stats**
```typescript
GET /api/student-status/statistics
Returns: DashboardStatistics
```

**Get Students by Status**
```typescript
GET /api/student-status/by-status/:status?limit=50&offset=0
Returns: Student[]
```

**Update Student Status**
```typescript
POST /api/student-status/update
Body: { studentId, newStatus, reason, adminUserId }
Returns: void
```

**Check Graduation**
```typescript
POST /api/student-status/check-graduation
Body: { studentId, adminUserId }
Returns: { isEligible: boolean }
```

## Future Enhancements

1. **Batch Graduation Processing**: Process multiple students at once
2. **Graduation Ceremonies**: Track graduation event attendance
3. **Certificate Generation**: Auto-generate certificates on graduation
4. **SMS/Email Notifications**: Notify students of graduation
5. **Export Reports**: Export statistics and records
6. **Advanced Analytics**: Dashboard with charts and trends
7. **Webhook Integration**: Notify external systems of status changes

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review database schema for data integrity
3. Check browser console for JavaScript errors
4. Review Supabase logs for database errors

## License

Part of Interlink Polytechnic Result Checker System
