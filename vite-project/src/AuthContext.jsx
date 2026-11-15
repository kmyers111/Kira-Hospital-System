import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const refreshAccessToken = useCallback(async () => {
    const response = await axios.post(
      `${getApiBaseUrl()}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token = response?.data?.accessToken || null;
    setAccessToken(token);
    return token;
  }, []);

  const authenticatedGet = useCallback(async (url, options = {}) => {
    try {
      return await axios.get(url, {
        ...options,
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }

      const token = await refreshAccessToken();
      return axios.get(url, {
        ...options,
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    }
  }, [accessToken, refreshAccessToken]);

  const authenticatedPost = useCallback(async (url, data, options = {}) => {
    try {
      return await axios.post(url, data, {
        ...options,
        withCredentials: true,
        headers: {
          ...options.headers,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }

      const token = await refreshAccessToken();
      return axios.post(url, data, {
        ...options,
        withCredentials: true,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    }
  }, [accessToken, refreshAccessToken]);

  const authenticatedPut = useCallback(async (url, data, options = {}) => {
    try {
      return await axios.put(url, data, {
        ...options,
        withCredentials: true,
        headers: {
          ...options.headers,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
    } catch (error) {
      if (error?.response?.status !== 401) {
        throw error;
      }

      const token = await refreshAccessToken();
      return axios.put(url, data, {
        ...options,
        withCredentials: true,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await refreshAccessToken();
        const meResponse = await axios.get(`${getApiBaseUrl()}/api/auth/me`, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUser(meResponse.data);
      } catch (error) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [refreshAccessToken]);

  const login = async ({ username, user_name, password }) => {
    const response = await axios.post(
      `${getApiBaseUrl()}/api/auth/login`,
      { username: username || user_name, password },
      { withCredentials: true }
    );
    const token = response?.data?.accessToken || null;
    setAccessToken(token);

    const meResponse = await axios.get(`${getApiBaseUrl()}/api/auth/me`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setUser(meResponse.data);
    return meResponse.data;
  };

  const logout = async () => {
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );
    } catch {
      setAuthError('Unable to end the session.');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    authError,
    login,
    logout,
    authenticatedGet,
    authenticatedPost,
    authenticatedPut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
