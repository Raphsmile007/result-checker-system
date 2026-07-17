// Student Status Types
export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'DEFERRED' | 'SUSPENDED' | 'WITHDRAWN' | 'EXPELLED' | 'ALUMNI';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  matNumber: string;
  email?: string;
  status: StudentStatus;
  graduationSession?: string;
  graduationDate?: Date;
  graduationCgpa?: number;
  isAlumni: boolean;
  academicRecordLocked: boolean;
  departmentId: string;
  programmeId: string;
  levelOfEntry: 'ND I' | 'HND I';
  currentLevel?: 'ND I' | 'ND II' | 'HND I' | 'HND II';
  passportUrl?: string;
}

export interface StudentStatusHistory {
  id: string;
  studentId: string;
  previousStatus: StudentStatus;
  newStatus: StudentStatus;
  reason: string;
  changedBy: string;
  changedAt: Date;
  metadata?: Record<string, any>;
}

export interface GraduationRequirements {
  id: string;
  programmeId: string;
  level: 'ND' | 'HND';
  minCgpa: number;
  minCreditUnits: number;
  requiredCourses: number;
  otherRequirements?: Record<string, any>;
}

export interface StudentGraduation {
  id: string;
  studentId: string;
  graduationSession: string;
  graduationDate: Date;
  cgpaAtGraduation: number;
  totalCreditUnits: number;
  programmeCompleted: 'ND' | 'HND' | 'COMBINED';
  graduationProcessedBy: string;
  isAutomatic: boolean;
}

export interface DashboardStatistics {
  activeStudents: number;
  graduatedStudents: number;
  deferredStudents: number;
  suspendedStudents: number;
  withdrawnStudents: number;
  expelledStudents: number;
  alumniCount: number;
  publishedResults: number;
  pendingResults: number;
}

export interface AcademicRecord {
  results: any[];
  cgpa: number;
  totalCredits: number;
  courseCount: number;
}
