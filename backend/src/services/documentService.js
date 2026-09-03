const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const subscriptionService = require('./subscriptionService');

function getExpiresAt30Days() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  return Number.isFinite(t) && t <= Date.now();
}

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
      let expiresAt = documentData.expiresAt;
      if (expiresAt === undefined) {
        try {
          const keep = await subscriptionService.userKeepsLibraryForever(documentData.userId);
          expiresAt = keep ? null : getExpiresAt30Days();
        } catch {
          expiresAt = getExpiresAt30Days();
        }
      }
      const payload = {
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
          updated_at: new Date().toISOString(),
          expires_at: expiresAt,
      };
      const insert = async (row) => this.getSupabaseClient().from('documents').insert([row]).select().single();
      let { data, error } = await insert(payload);
      if (error) {
        const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
        const missingExpires =
          error.code === 'PGRST204' ||
          (msg.includes('expires_at') && (msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('could not find')));
        if (missingExpires) {
          const { expires_at, ...without } = payload;
          const retry = await insert(without);
          if (retry.error) throw retry.error;
          return retry.data;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Create a document from pasted text (no file upload).
   * Used when users paste essay content and analyze - saves to library.
   * @param {string} userId - User ID
   * @param {string} content - Pasted text content
   * @param {string} [title] - Optional title (default: "Pasted Essay")
   * @returns {Promise<Object>} Created document
   */
  async createDocumentFromText(userId, content, title = 'Pasted Essay') {
    const wordCount = (content || '').trim().split(/\s+/).filter(Boolean).length;
    const fileSize = Buffer.byteLength(content || '', 'utf8');
    const documentData = {
      userId,
      title: title || 'Pasted Essay',
      originalFilename: 'Pasted Essay.txt',
      fileType: 'text/plain',
      fileSize,
      s3Key: `pasted/${uuidv4()}.txt`,
      s3Url: null,
      contentText: content,
      wordCount,
      pageCount: Math.max(1, Math.ceil(wordCount / 250)),
    };
    return this.createDocument(documentData);
  }

  /**
   * Check if a document is a pasted-text document (no real S3 file)
   * @param {Object} document - Document object
   * @returns {boolean}
   */
  isPastedDocument(document) {
    return document?.s3_key?.startsWith?.('pasted/') || false;
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
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        const msg = `${error.message || ''}`.toLowerCase();
        if (msg.includes('expires_at')) {
          const fallback = await this.getSupabaseClient()
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);
          if (fallback.error) throw fallback.error;
          return fallback.data || [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  /**
   * Total number of documents a user owns (for the hard cap +
   * the "X / cap" usage indicator). Uses a HEAD count so we
   * don't pull rows just to count them.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async countUserDocuments(userId) {
    const { count, error } = await this.getSupabaseClient()
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    if (error) throw error;
    return count || 0;
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

      if (!data) return null;
      if (isExpired(data.expires_at)) return null;
      return data;
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
    const runUpdate = async (payload) => {
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .eq('user_id', userId)
        .select()
        .single();
      return { data, error };
    };

    try {
      const { data, error } = await runUpdate(updateData);
      if (!error) return data;

      // Resilience: the editor autosave writes content_html /
      // last_edited_at. If that migration hasn't been applied to
      // this environment's DB yet, Postgres rejects the WHOLE
      // update and the user's draft would be lost on every save.
      // Detect the missing-column error and retry WITHOUT those
      // newer columns so the core fields (content_text, word_count)
      // still persist — degraded, but never silent data loss.
      const msg = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
      const looksLikeMissingColumn =
        error.code === 'PGRST204' ||
        /column .* does not exist/.test(msg) ||
        ((msg.includes('content_html') || msg.includes('last_edited_at')) &&
          (msg.includes('schema cache') || msg.includes('could not find') || msg.includes('does not exist')));

      const hasNewerColumns =
        updateData && (('content_html' in updateData) || ('last_edited_at' in updateData));

      if (looksLikeMissingColumn && hasNewerColumns) {
        // eslint-disable-next-line no-unused-vars
        const { content_html, last_edited_at, ...safe } = updateData;
        console.warn(
          '[documentService] content_html/last_edited_at column missing — ' +
          'saving without them. Run the documents_content_html migration.'
        );
        const retry = await runUpdate(safe);
        if (retry.error) throw retry.error;
        return retry.data;
      }

      throw error;
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
      const now = Date.now();
      return (data || []).filter((d) => !d.expires_at || new Date(d.expires_at).getTime() > now);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * First paid plan: keep every document this user owns. expires_at
   * null means permanent (same as study packs created while on Pro).
   */
  async makeUserDocumentsPermanent(userId) {
    if (!userId) return { updated: 0 };
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .update({ expires_at: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .not('expires_at', 'is', null)
        .select('id');
      if (error) throw error;
      return { updated: data?.length || 0 };
    } catch (error) {
      const msg = `${error.message || ''}`.toLowerCase();
      if (msg.includes('expires_at') && msg.includes('does not exist')) return { updated: 0 };
      console.error('Error making documents permanent:', error);
      return { updated: 0 };
    }
  }

  /**
   * Delete free-user documents whose 30-day window has passed.
   * Permanent rows (expires_at null) are never touched.
   */
  async cleanupExpiredDocuments() {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.getSupabaseClient()
        .from('documents')
        .delete()
        .not('expires_at', 'is', null)
        .lt('expires_at', now)
        .select('id');
      if (error) throw error;
      console.log(`Cleaned up ${data?.length || 0} expired documents`);
      return { deleted: data?.length || 0 };
    } catch (error) {
      console.error('Database error in cleanupExpiredDocuments:', error);
      return { deleted: 0 };
    }
  }
}

module.exports = new DocumentService();
