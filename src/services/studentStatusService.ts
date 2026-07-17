import { supabaseClient } from './supabaseClient';
import { StudentStatus, DashboardStatistics, AcademicRecord } from '../types/studentStatus';

export const studentStatusService = {
  // ===== STUDENT STATUS OPERATIONS =====
  async updateStudentStatus(
    studentId: string,
    newStatus: StudentStatus,
    reason: string,
    adminUserId: string
  ): Promise<void> {
    try {
      // Get current status
      const { data: student, error: studentError } = await supabaseClient
        .from('students')
        .select('status')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const previousStatus = student.status;

      // Update student status
      await supabaseClient
        .from('students')
        .update({ status: newStatus })
        .eq('id', studentId);

      // Record status history
      await supabaseClient
        .from('student_status_history')
        .insert({
          student_id: studentId,
          previous_status: previousStatus,
          new_status: newStatus,
          reason,
          changed_by: adminUserId,
        });
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  },

  async getStudentsByStatus(status: StudentStatus, limit = 50, offset = 0) {
    const { data, error } = await supabaseClient
      .from('students')
      .select('*, department:departments(*), programme:programmes(*)')
      .eq('status', status)
      .order('firstName')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  async getActiveStudents(limit = 50, offset = 0) {
    return this.getStudentsByStatus('ACTIVE', limit, offset);
  },

  async getGraduatedStudents(limit = 50, offset = 0) {
    return this.getStudentsByStatus('GRADUATED', limit, offset);
  },

  // ===== AUTOMATIC GRADUATION =====
  async checkAndProcessGraduation(studentId: string, adminUserId: string): Promise<boolean> {
    try {
      // Get student details
      const { data: student, error: studentError } = await supabaseClient
        .from('students')
        .select('*, programme:programmes(*)')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Get graduation requirements
      const { data: requirements, error: reqError } = await supabaseClient
        .from('graduation_requirements')
        .select('*')
        .eq('programme_id', student.programme_id)
        .single();

      if (reqError) throw reqError;

      // Get student's academic record
      const academicRecord = await this.getStudentAcademicRecord(studentId);

      // Check if student meets graduation requirements
      const meetsRequirements = this.checkGraduationRequirements(
        academicRecord,
        requirements,
        student.level_of_entry
      );

      if (!meetsRequirements) {
        return false;
      }

      // Process graduation
      await this.processGraduation(studentId, academicRecord, adminUserId);
      return true;
    } catch (error) {
      console.error('Error checking graduation:', error);
      throw error;
    }
  },

  private async getStudentAcademicRecord(studentId: string): Promise<AcademicRecord> {
    const { data: results, error } = await supabaseClient
      .from('results')
      .select('*, course:courses(*)')
      .eq('student_id', studentId)
      .eq('status', 'PUBLISHED');

    if (error) throw error;

    const cgpa = this.calculateCGPA(results || []);
    const totalCredits = (results || []).reduce((sum, r) => sum + (r.course?.credit_units || 0), 0);
    const courseCount = (results || []).length;

    return { results: results || [], cgpa, totalCredits, courseCount };
  },

  private checkGraduationRequirements(
    academicRecord: AcademicRecord,
    requirements: any,
    levelOfEntry: string
  ): boolean {
    // Check CGPA requirement
    if (academicRecord.cgpa < requirements.min_cgpa) {
      return false;
    }

    // Check credit units requirement
    if (academicRecord.totalCredits < requirements.min_credit_units) {
      return false;
    }

    // Check course requirement
    if (academicRecord.courseCount < requirements.required_courses) {
      return false;
    }

    // Check if all results are approved and published
    const allPublished = academicRecord.results.every((r: any) => r.status === 'PUBLISHED');
    if (!allPublished) {
      return false;
    }

    return true;
  },

  private async processGraduation(
    studentId: string,
    academicRecord: AcademicRecord,
    adminUserId: string
  ): Promise<void> {
    const currentSession = this.getCurrentSession();
    const graduationDate = new Date();

    // Update student status
    await supabaseClient
      .from('students')
      .update({
        status: 'GRADUATED',
        graduation_session: currentSession,
        graduation_date: graduationDate.toISOString(),
        graduation_cgpa: academicRecord.cgpa,
        is_alumni: true,
        academic_record_locked: true,
      })
      .eq('id', studentId);

    // Record graduation
    const { data: student } = await supabaseClient
      .from('students')
      .select('programme_id, level_of_entry')
      .eq('id', studentId)
      .single();

    const programmeCompleted = this.determineProgrammeCompleted(student.level_of_entry);

    await supabaseClient
      .from('student_graduations')
      .insert({
        student_id: studentId,
        graduation_session: currentSession,
        graduation_date: graduationDate.toISOString(),
        cgpa_at_graduation: academicRecord.cgpa,
        total_credit_units: academicRecord.totalCredits,
        programme_completed: programmeCompleted,
        graduation_processed_by: adminUserId,
        is_automatic: true,
      });

    // Update status history
    await studentStatusService.updateStudentStatus(
      studentId,
      'GRADUATED',
      'Automatic graduation - all requirements met',
      adminUserId
    );
  },

  private getCurrentSession(): string {
    const now = new Date();
    const year = now.getFullYear();
    return `${year}/${year + 1}`;
  },

  private determineProgrammeCompleted(levelOfEntry: string): 'ND' | 'HND' | 'COMBINED' {
    // Logic to determine if student completed ND only, HND only, or both
    return 'COMBINED';
  },

  private calculateCGPA(results: any[]): number {
    if (results.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach(result => {
      const gradePoints = this.getGradePoints(result.grade);
      const credits = result.course?.credit_units || 0;
      totalPoints += gradePoints * credits;
      totalCredits += credits;
    });

    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
  },

  private getGradePoints(grade: string): number {
    const gradeMap: Record<string, number> = {
      'A': 4.0,
      'B': 3.0,
      'C': 2.0,
      'D': 1.0,
      'E': 0.0,
      'F': 0.0,
    };
    return gradeMap[grade] || 0;
  },

  // ===== DASHBOARD STATISTICS =====
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    try {
      const [
        activeRes,
        graduatedRes,
        deferredRes,
        suspendedRes,
        withdrawnRes,
        expelledRes,
        graduationsRes,
        publishedRes,
        pendingRes,
      ] = await Promise.all([
        supabaseClient
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE'),
        supabaseClient
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'GRADUATED'),
        supabaseClient
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'DEFERRED'),
        supabaseClient
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'SUSPENDED'),
        supabaseClient
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'WITHDRAWN'),
        supabaseClient
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'EXPELLED'),
        supabaseClient
          .from('student_graduations')
          .select('*'),
        supabaseClient
          .from('results')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true),
        supabaseClient
          .from('results')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'APPROVED')
          .eq('is_published', false),
      ]);

      return {
        activeStudents: activeRes.count || 0,
        graduatedStudents: graduatedRes.count || 0,
        deferredStudents: deferredRes.count || 0,
        suspendedStudents: suspendedRes.count || 0,
        withdrawnStudents: withdrawnRes.count || 0,
        expelledStudents: expelledRes.count || 0,
        alumniCount: (graduationsRes.data || []).length,
        publishedResults: publishedRes.count || 0,
        pendingResults: pendingRes.count || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      throw error;
    }
  },

  // ===== FILTER & SEARCH =====
  async searchStudents(
    query: string,
    status?: StudentStatus,
    department?: string,
    limit = 20
  ) {
    let dbQuery = supabaseClient
      .from('students')
      .select('*, department:departments(*), programme:programmes(*)')
      .or(`firstName.ilike.%${query}%,lastName.ilike.%${query}%,matNumber.ilike.%${query}%`);

    if (status) dbQuery = dbQuery.eq('status', status);
    if (department) dbQuery = dbQuery.eq('department_id', department);

    const { data, error } = await dbQuery.limit(limit);
    if (error) throw error;
    return data;
  },
};
