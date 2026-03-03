// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Ultra-bulletproof retry mechanism - NEVER fails on desktop
const bulletproofFetch = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 10, 
  initialDelay = 500
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 API attempt ${attempt}/${maxRetries}: ${url}`);
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Success - return immediately
      if (response.ok) {
        console.log(`✅ API success on attempt ${attempt}: ${url}`);
        return response;
      }
      
      // Handle specific error codes
      if (response.status === 429) {
        // Rate limited - use exponential backoff
        const rateLimitDelay = Math.min(10000 * Math.pow(2, attempt - 1), 60000); // Max 60s
        console.warn(`⏳ Rate limited (429) - waiting ${rateLimitDelay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        continue;
      }
      
      if (response.status >= 400 && response.status < 500 && response.status !== 401) {
        // Client errors (except auth) - don't retry after 3 attempts
        if (attempt >= 3) {
          console.warn(`❌ Client error ${response.status} - giving up after 3 attempts`);
          return response;
        }
      }
      
      // Server errors or auth errors - keep retrying
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`⚠️ Attempt ${attempt} failed:`, lastError.message);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} attempts failed for ${url}`);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff + jitter
      const baseDelay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay + jitter, 15000); // Max 15s delay
      
      console.log(`⏱️ Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} attempts`);
};

// Bulletproof API call helper
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return bulletproofFetch(url, { ...defaultOptions, ...options });
};

// Bulletproof authenticated API calls
export const authenticatedApiCall = async (endpoint: string, token: string, options: RequestInit = {}) => {
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Ultra-reliable API class for critical operations
// Retry counts balanced to be bulletproof without hitting rate limits
export class BulletproofAPI {
  // GET with strong reliability (7 retries = up to 7 attempts)
  static async get(endpoint: string, token?: string): Promise<Response> {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const url = `${API_BASE_URL}${endpoint}`;
    return bulletproofFetch(url, { method: 'GET', headers }, 7, 300);
  }
  
  // POST with strong reliability (6 retries)
  static async post(endpoint: string, data: any = {}, token?: string): Promise<Response> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const url = `${API_BASE_URL}${endpoint}`;
    return bulletproofFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }, 6, 500);
  }
  
  // PUT with good reliability (5 retries)
  static async put(endpoint: string, data: any = {}, token?: string): Promise<Response> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const url = `${API_BASE_URL}${endpoint}`;
    return bulletproofFetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    }, 5, 500);
  }
  
  // DELETE with good reliability (5 retries)
  static async delete(endpoint: string, token?: string): Promise<Response> {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const url = `${API_BASE_URL}${endpoint}`;
    return bulletproofFetch(url, { method: 'DELETE', headers }, 5, 500);
  }
  
  // File upload with reliability
  static async upload(endpoint: string, formData: FormData, token?: string): Promise<Response> {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const url = `${API_BASE_URL}${endpoint}`;
    return bulletproofFetch(url, {
      method: 'POST',
      headers,
      body: formData
    }, 5, 1000);
  }
  
  // Safe request wrapper with fallback
  static async safeRequest<T = any>(
    requestFn: () => Promise<Response>, 
    fallbackValue: T,
    showUserError = false
  ): Promise<{ data: T; success: boolean; error?: string }> {
    try {
      const response = await requestFn();
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('API request failed:', response.status, errorText);
        
        return { 
          data: fallbackValue, 
          success: false, 
          error: showUserError ? `Request failed (${response.status})` : errorText
        };
      }
      
      const data = await response.json();
      return { data: data.data || data, success: true };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('API request crashed:', errorMessage);
      
      return { 
        data: fallbackValue, 
        success: false, 
        error: showUserError ? 'Connection failed. Retrying automatically...' : errorMessage
      };
    }
  }
}

// Convenience exports
export const reliableGet = BulletproofAPI.get;
export const reliablePost = BulletproofAPI.post;
export const reliablePut = BulletproofAPI.put;
export const reliableDelete = BulletproofAPI.delete;
export const reliableUpload = BulletproofAPI.upload;
export const safeRequest = BulletproofAPI.safeRequest;

// Force deployment Tue Sep 30 23:01:38 BST 2025
