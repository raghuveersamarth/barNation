import { supabase } from './supabase';

export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp(
    { email, password },
    { data: metadata }
  );
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback) => {
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
};
