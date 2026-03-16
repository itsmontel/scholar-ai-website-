const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

class DocumentService {
  constructor() {
    this.supabase = null;
  }

  getSupabaseClient() {
    if (!this.supabase) {
      // Use service role key to bypass RLS (required when documents table has RLS enabled)
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );
    }
    return this.supabase;
  }

  /**
   * Create a new document record
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} Created document
   */
  async createDocument(documentData) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .insert([{
          id: uuidv4(),
          user_id: documentData.userId,
          title: documentData.title,
          original_filename: documentData.originalFilename,
          file_type: documentData.fileType,
          file_size: documentData.fileSize,
          s3_key: documentData.s3Key,
          s3_url: documentData.s3Url,
          content_text: documentData.contentText,
          word_count: documentData.wordCount,
          page_count: documentData.pageCount,
          upload_status: 'processed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get documents for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User documents
   */
  async getUserDocuments(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
      
      let query = this.getSupabaseClient()
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object>} Document data
   */
  async getDocumentById(documentId, userId) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }

  /**
   * Update document metadata
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated document
   */
  async updateDocument(documentId, userId, updateData) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(documentId, userId) {
    try {
      const { error } = await this.getSupabaseClient()
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (error) throw error;
      console.log(`✅ Document deleted from database: ${documentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Document statistics
   */
  async getDocumentStats(userId) {
    try {
      // Get documents data
      const { data: documentsData, error: documentsError } = await this.getSupabaseClient()
        .from('documents')
        .select('id, created_at, word_count, file_size, file_type')
        .eq('user_id', userId);

      if (documentsError) throw documentsError;

      // Get analyses data
      const { data: analysesData, error: analysesError } = await this.getSupabaseClient()
        .from('document_analyses')
        .select('id, created_at')
        .eq('user_id', userId);

      if (analysesError) throw analysesError;

      // Calculate last activity
      let lastActivity = null;
      const allActivities = [
        ...(documentsData || []).map(doc => ({ date: doc.created_at, type: 'document' })),
        ...(analysesData || []).map(analysis => ({ date: analysis.created_at, type: 'analysis' }))
      ];

      if (allActivities.length > 0) {
        const mostRecent = allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        lastActivity = mostRecent.date;
      }

      // Return stats in the format expected by the frontend
      return {
        totalDocuments: documentsData?.length || 0,
        documentsAnalyzed: analysesData?.length || 0,
        lastActivity: lastActivity,
        totalWords: documentsData?.reduce((sum, doc) => sum + (doc.word_count || 0), 0) || 0,
        totalSize: documentsData?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0,
        fileTypes: documentsData?.reduce((acc, doc) => {
          acc[doc.file_type] = (acc[doc.file_type] || 0) + 1;
          return acc;
        }, {}) || {},
        recentUploads: (documentsData || []).slice(0, 5).map(doc => ({
          id: doc.id,
          title: doc.title || 'Untitled Document',
          fileType: doc.file_type,
          wordCount: doc.word_count || 0,
          createdAt: doc.created_at
        }))
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }

  /**
   * Search documents by title or content
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  async searchDocuments(userId, searchTerm) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchTerm}%,content_text.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
}

module.exports = new DocumentService();
