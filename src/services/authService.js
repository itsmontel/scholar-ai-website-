import { API_BASE_URL } from '../config/api.js';

class AuthService {
  constructor() {
    // Token is now in httpOnly cookie (not accessible to JS) - this is for backward compatibility only
    this.token = localStorage.getItem('authToken'); // Legacy fallback
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.refreshPromise = null; // Prevent multiple simultaneous refresh calls
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies - server sets httpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user data only (token is in httpOnly cookie, not accessible to JS)
      this.user = data.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      // Clear legacy token from localStorage if present
      localStorage.removeItem('authToken');
      this.token = null;

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken() {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  async _performTokenRefresh() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie is sent automatically
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Token is refreshed in httpOnly cookie by server
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear auth data
      this.logout();
      throw error;
    }
  }

  async logout() {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies so server can clear them
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken'); // Clear legacy token
      localStorage.removeItem('user');
    }
  }

  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed');
      }

      return data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  async resendVerification(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      return data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie is sent automatically
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user information');
      }

      this.user = data.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));

      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  isAuthenticated() {
    // Check if we have user data (token is in httpOnly cookie, not accessible)
    return !!this.user;
  }

  isEmailVerified() {
    return this.user?.emailVerified === true;
  }

  getToken() {
    // Token is in httpOnly cookie - return null (legacy compatibility)
    return null;
  }

  getUser() {
    return this.user;
  }

  // Make authenticated API calls with automatic token refresh
  async authenticatedFetch(url, options = {}) {
    const makeRequest = async () => {
      return fetch(url, {
        ...options,
        credentials: 'include', // Cookie is sent automatically
        headers: {
          ...options.headers,
        },
      });
    };

    try {
      // First attempt with current cookie
      let response = await makeRequest();

      // If token expired, try to refresh and retry
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        await this.refreshToken();
        response = await makeRequest();
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }
}

export default new AuthService();
