import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long` 
    };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters long` 
    };
  }
  
  if (name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Name must be no more than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters long` 
    };
  }
  
  return { isValid: true };
};

// Age validation
export const validateAge = (age) => {
  if (!age) {
    return { isValid: false, error: 'Age is required' };
  }
  
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) {
    return { isValid: false, error: 'Age must be a number' };
  }
  
  if (ageNum < 13 || ageNum > 100) {
    return { isValid: false, error: 'Age must be between 13 and 100' };
  }
  
  return { isValid: true };
};

// Gender validation
export const validateGender = (gender) => {
  if (!gender) {
    return { isValid: false, error: 'Gender is required' };
  }
  
  const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
  if (!validGenders.includes(gender.toLowerCase())) {
    return { isValid: false, error: 'Please select a valid gender option' };
  }
  
  return { isValid: true };
};

// Workout notes validation
export const validateWorkoutNotes = (notes) => {
  if (!notes) {
    return { isValid: true }; // Notes are optional
  }
  
  if (notes.length > VALIDATION_RULES.WORKOUT_NOTES_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Notes must be no more than ${VALIDATION_RULES.WORKOUT_NOTES_MAX_LENGTH} characters long` 
    };
  }
  
  return { isValid: true };
};

// Sets validation
export const validateSets = (sets) => {
  if (!sets) {
    return { isValid: false, error: 'Sets is required' };
  }
  
  const setsNum = parseInt(sets);
  if (isNaN(setsNum)) {
    return { isValid: false, error: 'Sets must be a number' };
  }
  
  if (setsNum < 1 || setsNum > 50) {
    return { isValid: false, error: 'Sets must be between 1 and 50' };
  }
  
  return { isValid: true };
};

// Reps validation
export const validateReps = (reps) => {
  if (!reps) {
    return { isValid: false, error: 'Reps is required' };
  }
  
  const repsNum = parseInt(reps);
  if (isNaN(repsNum)) {
    return { isValid: false, error: 'Reps must be a number' };
  }
  
  if (repsNum < 1 || repsNum > 1000) {
    return { isValid: false, error: 'Reps must be between 1 and 1000' };
  }
  
  return { isValid: true };
};

// Weight validation
export const validateWeight = (weight) => {
  if (!weight) {
    return { isValid: true }; // Weight is optional for bodyweight exercises
  }
  
  const weightNum = parseFloat(weight);
  if (isNaN(weightNum)) {
    return { isValid: false, error: 'Weight must be a number' };
  }
  
  if (weightNum < 0 || weightNum > 1000) {
    return { isValid: false, error: 'Weight must be between 0 and 1000 kg' };
  }
  
  return { isValid: true };
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(field => {
    const rule = validationRules[field];
    const value = formData[field];
    
    const result = rule(value);
    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// Common validation rules
export const VALIDATION_RULES = {
  email: validateEmail,
  password: validatePassword,
  name: validateName,
  age: validateAge,
  gender: validateGender,
  workoutNotes: validateWorkoutNotes,
  sets: validateSets,
  reps: validateReps,
  weight: validateWeight,
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validateAge,
  validateGender,
  validateWorkoutNotes,
  validateSets,
  validateReps,
  validateWeight,
  validateForm,
  VALIDATION_RULES,
};
