/**
 * API Service
 * Centralized API calls with error handling
 */

import { API_ENDPOINTS } from '../config/constants';

/**
 * HTTP request wrapper with error handling
 * Supports both old and new API response formats
 */
const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const responseData = await response.json();

    if (!response.ok) {
      const err = new Error(responseData.message || 'Request failed');
      err.status = response.status;
      err.error = responseData.error;
      throw err;
    }

    // New standardized format: { success, message, data }
    // Return data property if it exists, otherwise return entire response for backward compatibility
    if (responseData.hasOwnProperty('success') && responseData.hasOwnProperty('data')) {
      return responseData.data;
    }

    // Fallback: return entire response (old format or non-standard response)
    return responseData;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    const netErr = new Error('Network error. Please check your connection.');
    netErr.status = 0;
    throw netErr;
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Login user
   */
  login: async (username, password) => {
    const data = await request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return data;
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    const data = await request(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  },

  /**
   * Get current user profile
   */
  getProfile: async (token) => {
    const data = await request(API_ENDPOINTS.AUTH.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (token, updates) => {
    const data = await request(API_ENDPOINTS.AUTH.ME, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    return data;
  },
};

/**
 * Building API
 */
export const buildingAPI = {
  /**
   * Get public buildings list
   */
  getPublicBuildings: async () => {
    const data = await request(API_ENDPOINTS.BUILDINGS.PUBLIC);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get building info
   */
  getBuildingInfo: async (token, buildingId) => {
    const data = await request(API_ENDPOINTS.BUILDINGS.INFO(buildingId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Get vacant apartments
   */
  getVacantApartments: async (buildingId) => {
    const data = await request(API_ENDPOINTS.BUILDINGS.VACANT_APARTMENTS(buildingId));
    return Array.isArray(data) ? data : [];
  },
};

/**
 * Apartment API
 */
export const apartmentAPI = {
  /**
   * Get apartment details
   */
  getDetails: async (token, apartmentId) => {
    const data = await request(API_ENDPOINTS.APARTMENTS.DETAILS(apartmentId), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },
};

/**
 * Associate API
 */
export const associateAPI = {
  /**
   * Get associate profile
   */
  getProfile: async (token) => {
    const data = await request(API_ENDPOINTS.ASSOCIATE.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Update associate profile
   */
  updateProfile: async (token, updates) => {
    const data = await request(API_ENDPOINTS.ASSOCIATE.PROFILE, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    return data;
  },
};
