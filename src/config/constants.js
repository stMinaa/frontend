/**
 * Application Constants
 * Centralized configuration for API endpoints and app settings
 */

// API Configuration
// Base URL should not include /api path
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const API_BASE_URL = BASE_URL.replace(/\/api\/?$/, ''); // Remove trailing /api if present
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },
  BUILDINGS: {
    PUBLIC: `${API_BASE_URL}/api/buildings/public`,
    INFO: (id) => `${API_BASE_URL}/api/buildings/${id}/info`,
    VACANT_APARTMENTS: (id) => `${API_BASE_URL}/api/buildings/${id}/apartments/vacant`,
  },
  APARTMENTS: {
    DETAILS: (id) => `${API_BASE_URL}/api/apartments/${id}`,
  },
  ASSOCIATE: {
    PROFILE: `${API_BASE_URL}/api/associate/profile`,
  },
};

// User Roles
export const USER_ROLES = {
  TENANT: 'tenant',
  MANAGER: 'manager',
  DIRECTOR: 'director',
  ADMIN: 'admin',
  ASSOCIATE: 'associate',
};

export const ROLE_LIST = Object.values(USER_ROLES);

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  MOBILE_REGEX: /^\d{7,15}$/,
  EMAIL_REGEX: /^\S+@\S+\.\S+$/,
};

// Session Configuration (no persistence)
export const SESSION_CONFIG = {
  PERSIST_TOKEN: false, // No auto-login on refresh
  TOKEN_EXPIRY: '1h',
};
