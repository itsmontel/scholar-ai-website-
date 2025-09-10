const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.supabase = null;
  }

  getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
    return this.supabase;
  }

  // Parse SQL query and execute with Supabase
  async query(sql, params = []) {
    const supabase = this.getSupabaseClient();
    
    try {
      console.log('Executing query:', { sql, params });
      
      // Handle different query types
      const queryType = sql.trim().split(' ')[0].toUpperCase();
      
      switch (queryType) {
        case 'SELECT':
          return await this.handleSelect(sql, params, supabase);
        case 'INSERT':
          return await this.handleInsert(sql, params, supabase);
        case 'UPDATE':
          return await this.handleUpdate(sql, params, supabase);
        case 'DELETE':
          return await this.handleDelete(sql, params, supabase);
        default:
          throw new Error(`Unsupported query type: ${queryType}`);
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async handleSelect(sql, params, supabase) {
    // Extract table name
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not extract table name from SELECT query');
    }
    
    const tableName = tableMatch[1];
    let query = supabase.from(tableName);

    // Handle WHERE clauses
    if (sql.includes('WHERE')) {
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+OFFSET|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        
        // Handle common WHERE patterns
        console.log('WHERE clause:', whereClause);
        console.log('Params:', params);
        
        if (whereClause.includes('email = $1')) {
          query = query.eq('email', params[0]);
        } else if (whereClause.includes('id = $1')) {
          query = query.eq('id', params[0]);
        } else if (whereClause.includes('user_id = $1')) {
          query = query.eq('user_id', params[0]);
        } else if (whereClause.includes('document_id = $1')) {
          query = query.eq('document_id', params[0]);
        } else if (whereClause.includes('email_verification_token = $1')) {
          query = query.eq('email_verification_token', params[0]);
        } else if (whereClause.includes('password_reset_token = $1')) {
          query = query.eq('password_reset_token', params[0]);
        } else if (whereClause.includes('stripe_subscription_id = $1')) {
          query = query.eq('stripe_subscription_id', params[0]);
        } else if (whereClause.includes('stripe_customer_id = $1')) {
          query = query.eq('stripe_customer_id', params[0]);
        } else {
          // Fallback: try to parse any column = $N pattern
          const paramMatch = whereClause.match(/(\w+)\s*=\s*\$(\d+)/);
          if (paramMatch) {
            const column = paramMatch[1];
            const paramIndex = parseInt(paramMatch[2]) - 1;
            if (paramIndex < params.length) {
              query = query.eq(column, params[paramIndex]);
            }
          }
        }
        
        // Handle multiple conditions
        if (whereClause.includes('AND')) {
          const conditions = whereClause.split('AND');
          conditions.forEach(condition => {
            const trimmed = condition.trim();
            if (trimmed.includes('email = $1')) {
              query = query.eq('email', params[0]);
            } else if (trimmed.includes('id = $2')) {
              query = query.eq('id', params[1]);
            } else if (trimmed.includes('user_id = $2')) {
              query = query.eq('user_id', params[1]);
            } else if (trimmed.includes('status = $2')) {
              query = query.eq('status', params[1]);
            } else if (trimmed.includes('password_reset_expires > NOW()')) {
              query = query.gt('password_reset_expires', new Date().toISOString());
            }
          });
        }
      }
    }

    // Handle ORDER BY
    if (sql.includes('ORDER BY')) {
      const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
      if (orderMatch) {
        const column = orderMatch[1];
        const direction = orderMatch[2].toLowerCase();
        query = query.order(column, { ascending: direction === 'asc' });
      }
    }

    // Handle LIMIT
    if (sql.includes('LIMIT')) {
      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        query = query.limit(parseInt(limitMatch[1]));
      }
    }

    // Handle OFFSET
    if (sql.includes('OFFSET')) {
      const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
      if (offsetMatch) {
        query = query.range(parseInt(offsetMatch[1]), parseInt(offsetMatch[1]) + 999);
      }
    }

    // Handle COUNT queries
    if (sql.includes('COUNT(*)')) {
      const { count, error } = await query.select('*', { count: 'exact', head: true });
      if (error) throw error;
      return { rows: [{ count }], rowCount: 1 };
    }

    // Execute the query
    const { data, error } = await query.select('*');
    if (error) throw error;
    
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  async handleInsert(sql, params, supabase) {
    // Extract table name
    const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not extract table name from INSERT query');
    }
    
    const tableName = tableMatch[1];
    
    // Extract column names and values
    const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!valuesMatch) {
      throw new Error('Could not extract VALUES from INSERT query');
    }
    
    // Parse the column names from the INSERT statement
    const columnsMatch = sql.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)/i);
    if (!columnsMatch) {
      throw new Error('Could not extract column names from INSERT query');
    }
    
    const columnNames = columnsMatch[1].split(',').map(col => col.trim());
    const values = params;
    
    // Create the data object
    const data = {};
    columnNames.forEach((column, index) => {
      if (values[index] !== undefined) {
        data[column] = values[index];
      }
    });

    // Handle special cases for different tables
    if (tableName === 'users') {
      // For users table, we need to handle the RETURNING clause
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return { rows: [result], rowCount: 1 };
    } else {
      // For other tables
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data])
        .select();
      
      if (error) throw error;
      return { rows: result || [], rowCount: result?.length || 0 };
    }
  }

  async handleUpdate(sql, params, supabase) {
    // Extract table name
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not extract table name from UPDATE query');
    }
    
    const tableName = tableMatch[1];
    
    // Extract SET clause
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
    if (!setMatch) {
      throw new Error('Could not extract SET clause from UPDATE query');
    }
    
    const setClause = setMatch[1];
    const updates = {};
    
    // Parse SET clause
    const setPairs = setClause.split(',');
    setPairs.forEach(pair => {
      const [column, value] = pair.split('=').map(s => s.trim());
      if (value === '$1') {
        updates[column] = params[0];
      } else if (value === '$2') {
        updates[column] = params[1];
      } else if (value === '$3') {
        updates[column] = params[2];
      } else if (value === 'CURRENT_TIMESTAMP') {
        updates[column] = new Date().toISOString();
      } else if (value === 'NULL') {
        updates[column] = null;
      } else if (value === 'true') {
        updates[column] = true;
      } else if (value === 'false') {
        updates[column] = false;
      }
    });

    let query = supabase.from(tableName).update(updates);

    // Handle WHERE clause
    if (sql.includes('WHERE')) {
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+RETURNING|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        
        if (whereClause.includes('id = $1')) {
          query = query.eq('id', params[0]);
        } else if (whereClause.includes('email = $1')) {
          query = query.eq('email', params[0]);
        } else if (whereClause.includes('user_id = $1')) {
          query = query.eq('user_id', params[0]);
        } else if (whereClause.includes('email_verification_token = $1')) {
          query = query.eq('email_verification_token', params[0]);
        } else if (whereClause.includes('password_reset_token = $1')) {
          query = query.eq('password_reset_token', params[0]);
        }
        
        // Handle multiple conditions
        if (whereClause.includes('AND')) {
          const conditions = whereClause.split('AND');
          conditions.forEach(condition => {
            const trimmed = condition.trim();
            if (trimmed.includes('id = $2')) {
              query = query.eq('id', params[1]);
            } else if (trimmed.includes('user_id = $2')) {
              query = query.eq('user_id', params[1]);
            } else if (trimmed.includes('status = $2')) {
              query = query.eq('status', params[1]);
            }
          });
        }
      }
    }

    // Handle RETURNING clause
    if (sql.includes('RETURNING')) {
      const returningMatch = sql.match(/RETURNING\s+(.+)/i);
      if (returningMatch) {
        const columns = returningMatch[1].split(',').map(col => col.trim());
        query = query.select(columns.join(','));
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  async handleDelete(sql, params, supabase) {
    // Extract table name
    const tableMatch = sql.match(/DELETE FROM\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not extract table name from DELETE query');
    }
    
    const tableName = tableMatch[1];
    let query = supabase.from(tableName).delete();

    // Handle WHERE clause
    if (sql.includes('WHERE')) {
      const whereMatch = sql.match(/WHERE\s+(.+)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        
        if (whereClause.includes('id = $1')) {
          query = query.eq('id', params[0]);
        } else if (whereClause.includes('user_id = $1')) {
          query = query.eq('user_id', params[0]);
        }
        
        // Handle multiple conditions
        if (whereClause.includes('AND')) {
          const conditions = whereClause.split('AND');
          conditions.forEach(condition => {
            const trimmed = condition.trim();
            if (trimmed.includes('id = $2')) {
              query = query.eq('id', params[1]);
            } else if (trimmed.includes('user_id = $2')) {
              query = query.eq('user_id', params[1]);
            }
          });
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return { rows: data || [], rowCount: data?.length || 0 };
  }
}

module.exports = new DatabaseService();
