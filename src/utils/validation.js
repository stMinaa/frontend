/**
 * Form Validation Utilities
 * Reusable validation functions for forms
 */

import { VALIDATION } from '../config/constants';

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  return { valid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` };
  }
  return { valid: true };
};

/**
 * Validate mobile number
 */
export const validateMobile = (mobile) => {
  if (!mobile) {
    return { valid: true }; // Optional field
  }
  if (!VALIDATION.MOBILE_REGEX.test(mobile)) {
    return { valid: false, message: 'Mobile number must be 7-15 digits' };
  }
  return { valid: true };
};

/**
 * Validate required text field
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || !value.trim()) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true };
};

/**
 * Validate login form
 */
export const validateLoginForm = ({ username, password }) => {
  const usernameCheck = validateRequired(username, 'Username/Email');
  if (!usernameCheck.valid) return usernameCheck;

  const passwordCheck = validateRequired(password, 'Password');
  if (!passwordCheck.valid) return passwordCheck;

  return { valid: true };
};

/**
 * Validate registration form
 */
export const validateRegistrationForm = ({ 
  username, 
  password, 
  email, 
  firstName, 
  lastName,
  mobile 
}) => {
  const usernameCheck = validateRequired(username, 'Username');
  if (!usernameCheck.valid) return usernameCheck;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) return passwordCheck;

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return emailCheck;

  const firstNameCheck = validateRequired(firstName, 'First name');
  if (!firstNameCheck.valid) return firstNameCheck;

  const lastNameCheck = validateRequired(lastName, 'Last name');
  if (!lastNameCheck.valid) return lastNameCheck;

  const mobileCheck = validateMobile(mobile);
  if (!mobileCheck.valid) return mobileCheck;

  return { valid: true };
};
