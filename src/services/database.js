import { supabase } from './supabase';

// Fetch user profile by user ID
export const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

// Update user profile data
export const updateUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, ...profileData });
  if (error) throw error;
  return data;
};

// Fetch clients list for a coach
export const fetchCoachClients = async (coachId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('coach_id', coachId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

// Fetch client progress data
export const fetchClientProgress = async (clientId) => {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data;
};

// Save workout log
export const logWorkout = async (workoutData) => {
  const { data, error } = await supabase
    .from('workouts')
    .insert([workoutData]);
  if (error) throw error;
  return data;
};

// Fetch today's workout for a client
export const fetchTodaysWorkout = async (clientId, dateISO) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('client_id', clientId)
    .eq('date', dateISO)
    .single();
  if (error) throw error;
  return data;
};
