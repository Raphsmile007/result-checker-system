import { supabaseClient } from './supabaseClient';
import { BulkPublishOperation, BulkPublishScope, PublishPreviewData } from '../types/bulkPublishing';

export const bulkPublishingService = {
  // ===== PREVIEW FUNCTIONALITY =====
  async generatePublishPreview(
    operationType: string,
    scope: BulkPublishScope,
    adminUserId: string
  ): Promise<PublishPreviewData[]> {
    try {
      let query = supabaseClient
        .from('results')
        .select(`
          id,
          student:students(firstName, lastName, matNumber),
          course:courses(code, title),
          score,
          grade,
          status
        `)
        .eq('status', 'APPROVED')
        .eq('is_published', false);

      // Apply scope filters
      if (scope.courseId) {
        query = query.eq('course_id', scope.courseId);
      }

      if (scope.departmentId) {
        query = query.eq('student.department_id', scope.departmentId);
      }

      if (scope.level) {
        query = query.eq('student.current_level', scope.level);
      }

      if (scope.semester) {
        query = query.eq('semester', scope.semester);
      }

      if (scope.session) {
        query = query.eq('academic_session', scope.session);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Store preview for later use
      await supabaseClient
        .from('bulk_publish_preview')
        .insert({
          admin_user_id: adminUserId,
          operation_type: operationType,
          publish_scope: scope,
          preview_data: data,
        });

      return (data || []).map(d => ({
        studentName: `${d.student.firstName} ${d.student.lastName}`,
        matNumber: d.student.matNumber,
        courseCode: d.course.code,
        courseTitle: d.course.title,
        score: d.score,
        grade: d.grade,
        status: d.status,
        requiresApproval: false,
      }));
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  },

  // ===== BULK PUBLISH OPERATIONS =====
  async publishResults(
    operationName: string,
    operationType: string,
    scope: BulkPublishScope,
    adminUserId: string
  ): Promise<BulkPublishOperation> {
    try {
      // Step 1: Get all records matching criteria
      const records = await this.getRecordsToPublish(scope);

      if (records.length === 0) {
        throw new Error('No approved results found matching the criteria');
      }

      // Step 2: Create bulk operation record
      const { data: operation, error: opError } = await supabaseClient
        .from('bulk_publish_operations')
        .insert({
          operation_name: operationName,
          operation_type: operationType,
          publish_scope: scope,
          total_records: records.length,
          status: 'IN_PROGRESS',
          initiated_by: adminUserId,
        })
        .select()
        .single();

      if (opError) throw opError;

      // Step 3: Create detail records for tracking
      const details = records.map(r => ({
        operation_id: operation.id,
        result_id: r.id,
        student_id: r.student_id,
        course_id: r.course_id,
        status: 'PENDING',
      }));

      await supabaseClient
        .from('bulk_publish_details')
        .insert(details);

      // Step 4: Perform actual publishing
      await this.executeBulkPublish(operation.id, records, adminUserId);

      return operation;
    } catch (error) {
      console.error('Error publishing results:', error);
      throw error;
    }
  },

  private async getRecordsToPublish(scope: BulkPublishScope) {
    let query = supabaseClient
      .from('results')
      .select('*, course:courses(*), student:students(*)')
      .eq('status', 'APPROVED')
      .eq('is_published', false);

    if (scope.courseId) query = query.eq('course_id', scope.courseId);
    if (scope.departmentId) query = query.eq('student.department_id', scope.departmentId);
    if (scope.level) query = query.eq('student.current_level', scope.level);
    if (scope.semester) query = query.eq('semester', scope.semester);
    if (scope.session) query = query.eq('academic_session', scope.session);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  private async executeBulkPublish(
    operationId: string,
    records: any[],
    adminUserId: string
  ) {
    let publishedCount = 0;
    let failedCount = 0;

    for (const record of records) {
      try {
        // Update result status
        await supabaseClient
          .from('results')
          .update({
            is_published: true,
            published_at: new Date().toISOString(),
            status: 'PUBLISHED',
          })
          .eq('id', record.id);

        // Create audit log
        await supabaseClient
          .from('result_publish_audit')
          .insert({
            result_id: record.id,
            operation_id: operationId,
            previous_state: 'APPROVED',
            new_state: 'PUBLISHED',
            published_by: adminUserId,
            publish_timestamp: new Date().toISOString(),
          });

        // Update detail record
        await supabaseClient
          .from('bulk_publish_details')
          .update({ status: 'PUBLISHED', published_at: new Date().toISOString() })
          .eq('operation_id', operationId)
          .eq('result_id', record.id);

        publishedCount++;
      } catch (error: any) {
        failedCount++;
        await supabaseClient
          .from('bulk_publish_details')
          .update({
            status: 'FAILED',
            error_message: error.message,
          })
          .eq('operation_id', operationId)
          .eq('result_id', record.id);
      }
    }

    // Update operation status
    await supabaseClient
      .from('bulk_publish_operations')
      .update({
        status: failedCount === 0 ? 'COMPLETED' : 'FAILED',
        published_records: publishedCount,
        failed_records: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', operationId);
  },

  // ===== UNPUBLISH FUNCTIONALITY (SUPER ADMIN ONLY) =====
  async unpublishResults(
    operationId: string,
    reason: string,
    superAdminId: string
  ): Promise<void> {
    try {
      // Get all published records from this operation
      const { data: details, error: detailsError } = await supabaseClient
        .from('bulk_publish_details')
        .select('result_id')
        .eq('operation_id', operationId)
        .eq('status', 'PUBLISHED');

      if (detailsError) throw detailsError;

      if (!details || details.length === 0) {
        throw new Error('No published records found in this operation');
      }

      // Unpublish all results
      for (const detail of details) {
        await supabaseClient
          .from('results')
          .update({
            is_published: false,
            status: 'APPROVED',
          })
          .eq('id', detail.result_id);

        // Create unpublish audit
        await supabaseClient
          .from('result_publish_audit')
          .update({
            is_unpublished: true,
            unpublished_by: superAdminId,
            unpublish_timestamp: new Date().toISOString(),
            unpublish_reason: reason,
          })
          .eq('result_id', detail.result_id);
      }

      // Mark operation as cancelled
      await supabaseClient
        .from('bulk_publish_operations')
        .update({ status: 'CANCELLED' })
        .eq('id', operationId);
    } catch (error) {
      console.error('Error unpublishing results:', error);
      throw error;
    }
  },

  // ===== MONITORING =====
  async getOperationProgress(operationId: string) {
    const { data: operation, error } = await supabaseClient
      .from('bulk_publish_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (error) throw error;

    const { data: details } = await supabaseClient
      .from('bulk_publish_details')
      .select('status')
      .eq('operation_id', operationId);

    return {
      operation,
      details,
      progressPercentage: operation.total_records > 0 ? (operation.published_records / operation.total_records) * 100 : 0,
    };
  },

  async getOperationHistory(limit = 20, offset = 0) {
    const { data, error } = await supabaseClient
      .from('bulk_publish_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },
};
