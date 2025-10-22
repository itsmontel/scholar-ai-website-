/**
 * CSRF Token Management Utility
 */

let csrfToken: string | null = null;

/**
 * Fetch CSRF token from the server
 */
export const fetchCSRFToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/csrf-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      csrfToken = data.token;
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  
  return null;
};

/**
 * Get current CSRF token (fetch if not available)
 */
export const getCSRFToken = async (): Promise<string | null> => {
  if (!csrfToken) {
    return await fetchCSRFToken();
  }
  return csrfToken;
};

/**
 * Clear stored CSRF token
 */
export const clearCSRFToken = (): void => {
  csrfToken = null;
};

/**
 * Enhanced fetch function with CSRF protection
 */
export const secureApiCall = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('authToken');
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing operations
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    const csrfToken = await getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If CSRF token is invalid, clear it and retry once
  if (response.status === 403 && response.headers.get('content-type')?.includes('application/json')) {
    try {
      const errorData = await response.clone().json();
      if (errorData.message?.includes('CSRF')) {
        clearCSRFToken();
        
        // Retry with new token
        const newCsrfToken = await getCSRFToken();
        if (newCsrfToken && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
          headers['X-CSRF-Token'] = newCsrfToken;
          return fetch(url, { ...options, headers });
        }
      }
    } catch {
      // If parsing fails, return original response
    }
  }

  return response;
};

/**
 * Secure POST request
 */
export const securePost = async (url: string, data?: any): Promise<Response> => {
  return secureApiCall(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Secure PUT request
 */
export const securePut = async (url: string, data?: any): Promise<Response> => {
  return secureApiCall(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Secure DELETE request
 */
export const secureDelete = async (url: string): Promise<Response> => {
  return secureApiCall(url, {
    method: 'DELETE',
  });
};
