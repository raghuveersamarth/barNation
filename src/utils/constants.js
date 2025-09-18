// App Constants
export const APP_CONFIG = {
  name: 'BarNation',
  version: '1.0.0',
  description: 'Streetlifting Coach & Client App',
  scheme: 'barnation',
};

// API Configuration
export const API_CONFIG = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ELITE: 'elite',
};

// Subscription Limits
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    clients: 3,
    features: ['basic_workouts', 'basic_tracking'],
  },
  [SUBSCRIPTION_TIERS.STARTER]: {
    clients: 10,
    features: ['basic_workouts', 'basic_tracking', 'progress_charts'],
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    clients: 25,
    features: ['basic_workouts', 'basic_tracking', 'progress_charts', 'video_uploads', 'advanced_analytics'],
  },
  [SUBSCRIPTION_TIERS.ELITE]: {
    clients: -1, // unlimited
    features: ['basic_workouts', 'basic_tracking', 'progress_charts', 'video_uploads', 'advanced_analytics', 'unlimited_clients', 'priority_support'],
  },
};

// User Roles
export const USER_ROLES = {
  COACH: 'coach',
  CLIENT: 'client',
};

// Workout Status
export const WORKOUT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

// Exercise Types
export const EXERCISE_TYPES = {
  BODYWEIGHT: 'bodyweight',
  WEIGHTED: 'weighted',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
};

// Chart Types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  RING: 'ring',
};

// Video Settings
export const VIDEO_CONFIG = {
  maxDuration: 60, // seconds
  maxFileSize: 50 * 1024 * 1024, // 50MB
  compressionQuality: 0.7,
  allowedFormats: ['mp4', 'mov', 'avi'],
};

// Storage Paths
export const STORAGE_PATHS = {
  AVATARS: 'avatars',
  WORKOUT_VIDEOS: 'workout-videos',
  PROFILE_IMAGES: 'profile-images',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  WORKOUT_COMPLETED: 'workout_completed',
  WORKOUT_ASSIGNED: 'workout_assigned',
  CLIENT_ADDED: 'client_added',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  SUBSCRIPTION_ERROR: 'Subscription error. Please contact support.',
  UPLOAD_ERROR: 'Upload failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  WORKOUT_SAVED: 'Workout saved successfully!',
  VIDEO_UPLOADED: 'Video uploaded successfully!',
  CLIENT_ADDED: 'Client added successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  WORKOUT_NOTES_MAX_LENGTH: 500,
};

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// Screen Names
export const SCREEN_NAMES = {
  // Auth
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  ROLE_SELECTION: 'RoleSelection',
  PROFILE_SETUP: 'ProfileSetup',
  
  // Coach
  COACH_DASHBOARD: 'CoachDashboard',
  CLIENT_LIST: 'ClientList',
  ADD_CLIENT: 'AddClient',
  CLIENT_DETAILS: 'ClientDetails',
  ANALYTICS: 'Analytics',
  
  // Client
  CLIENT_DASHBOARD: 'ClientDashboard',
  WORKOUT: 'Workout',
  PROGRESS: 'Progress',
  HISTORY: 'History',
  VIDEO_UPLOAD: 'VideoUpload',
  
  // Shared
  PROFILE: 'Profile',
  SUBSCRIPTION: 'Subscription',
  SETTINGS: 'Settings',
};

export default {
  APP_CONFIG,
  API_CONFIG,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_LIMITS,
  USER_ROLES,
  WORKOUT_STATUS,
  EXERCISE_TYPES,
  CHART_TYPES,
  VIDEO_CONFIG,
  STORAGE_PATHS,
  NOTIFICATION_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  ANIMATION_DURATION,
  SCREEN_NAMES,
};
