// Bulk Publishing Types
export interface BulkPublishScope {
  courseId?: string;
  departmentId?: string;
  level?: 'ND I' | 'ND II' | 'HND I' | 'HND II';
  semester?: number;
  session?: string;
  academicYear?: string;
}

export interface BulkPublishOperation {
  id: string;
  operationName: string;
  operationType: 'COURSE' | 'DEPARTMENT' | 'LEVEL' | 'SEMESTER' | 'SESSION' | 'ALL';
  publishScope: BulkPublishScope;
  totalRecords: number;
  publishedRecords: number;
  failedRecords: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  initiatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkPublishDetail {
  id: string;
  operationId: string;
  resultId: string;
  studentId: string;
  courseId: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  errorMessage?: string;
  publishedAt?: Date;
}

export interface PublishPreviewData {
  studentName: string;
  matNumber: string;
  courseCode: string;
  courseTitle: string;
  score: number;
  grade: string;
  status: string;
  requiresApproval: boolean;
}

export interface ResultPublishAudit {
  id: string;
  resultId: string;
  operationId?: string;
  previousState: string;
  newState: string;
  publishedBy: string;
  publishTimestamp: Date;
  isUnpublished: boolean;
  unpublishedBy?: string;
  unpublishTimestamp?: Date;
  unpublishReason?: string;
}
