const { createClient } = require('@supabase/supabase-js');

class UserService {
  constructor() {
    this.supabase = null;
  }

  getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );
    }
    return this.supabase;
  }

  async findUserByEmail(email) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Any account whose inbox matches this address (Gmail dots and +tags
   * collapse, see utils/canonicalEmail). Falls back to the exact address
   * until migrations/20261101_users_email_canonical.sql has run.
   */
  async findUserByInbox(email) {
    const { canonicalEmail } = require('../utils/canonicalEmail');
    const key = canonicalEmail(email);
    if (!key) return null;
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('id, email, email_verified, onboarding_completed, google_id, password_hash')
        .eq('email_canonical', key)
        .limit(1)
        .maybeSingle();
      if (!error) return data || null;
      const msg = `${error.message || ''}`.toLowerCase();
      if (!(msg.includes('email_canonical') && (msg.includes('column') || msg.includes('schema cache')))) throw error;
    } catch (error) {
      console.error('Error finding user by inbox:', error);
    }
    return this.findUserByEmail(email);
  }

  async findUserById(id) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findUserByGoogleId(googleId) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  async linkGoogleAccount(userId, googleId) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .update({ google_id: googleId })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error linking Google account:', error);
      throw error;
    }
  }

  /**
   * Insert a users row with its inbox key (email_canonical). Until
   * migrations/20261101_users_email_canonical.sql has run the column is
   * missing, so the insert is retried without it.
   */
  async insertUserRow(row) {
    const { canonicalEmail } = require('../utils/canonicalEmail');
    const withKey = row.email ? { ...row, email_canonical: canonicalEmail(row.email) } : row;
    let { data, error } = await this.getSupabaseClient().from('users').insert([withKey]).select().single();
    if (error) {
      const msg = `${error.message || ''}`.toLowerCase();
      if (withKey !== row && msg.includes('email_canonical') && (msg.includes('column') || msg.includes('schema cache'))) {
        console.warn('users.email_canonical missing. Run migrations/20261101_users_email_canonical.sql');
        ({ data, error } = await this.getSupabaseClient().from('users').insert([row]).select().single());
      }
    }
    if (error) throw error;
    return data;
  }

  async createGoogleUser({ googleId, email, name, picture, emailVerified = true, signupDevice = null }) {
    try {
      const data = await this.insertUserRow({
          google_id: googleId,
          email: email?.toLowerCase(),
          name: name,
          profile_picture: picture,
          email_verified: emailVerified,
          subscription_plan: 'free',
          subscription_status: 'active',
          // Device class at signup (mobile/tablet/desktop/unknown). Optional —
          // passport.js passes it through when available; legacy callers that
          // don't pass it leave the column NULL. See signup_device.sql and
          // src/utils/deviceParser.js for the parsing details.
          signup_device: signupDevice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return data;
    } catch (error) {
      console.error('Error creating Google user:', error);
      throw error;
    }
  }

  async createAppleUser({ email, name, firstName = null, lastName = null, emailVerified = true, signupDevice = null }) {
    try {
      const data = await this.insertUserRow({
          email: email?.toLowerCase(),
          name: name,
          first_name: firstName,
          last_name: lastName,
          email_verified: emailVerified,
          subscription_plan: 'free',
          subscription_status: 'active',
          signup_device: signupDevice,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return data;
    } catch (error) {
      console.error('Error creating Apple user:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      return await this.insertUserRow(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const { error } = await this.getSupabaseClient()
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async findUserByVerificationToken(token) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('email_verification_token', token)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by verification token:', error);
      throw error;
    }
  }

  async findUserByResetToken(token) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('password_reset_token', token)
        .gt('password_reset_expires', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  async getUserCount() {
    try {
      const { count, error } = await this.getSupabaseClient()
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting user count:', error);
      throw error;
    }
  }

  async findUserByUsername(username) {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  async isUsernameAvailable(username, excludeUserId = null) {
    try {
      let query = this.getSupabaseClient()
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase());
      
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }
      
      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  }

  async updateUsername(userId, username) {
    const normalizedUsername = username.toLowerCase().trim();
    
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      throw new Error('Username must be 3-30 characters and contain only letters, numbers, and underscores');
    }

    const isAvailable = await this.isUsernameAvailable(normalizedUsername, userId);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }

    return this.updateUser(userId, { username: normalizedUsername });
  }
}

module.exports = new UserService();
