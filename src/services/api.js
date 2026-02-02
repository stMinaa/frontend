/**
 * API Service
 * Centralized API calls with error handling
 */

import { API_ENDPOINTS } from '../config/constants';

/**
 * HTTP request wrapper with error handling
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

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'Request failed',
      };
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: 'Network error. Please check your connection.',
    };
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
