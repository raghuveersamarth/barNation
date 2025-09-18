import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionTier = () => {
    if (!subscription) return 'free';
    return subscription.tier || 'free';
  };

  const getClientLimit = () => {
    const tier = getSubscriptionTier();
    const limits = {
      free: 3,
      starter: 10,
      pro: 25,
      elite: -1, // unlimited
    };
    return limits[tier] || 3;
  };

  const canAddClient = (currentClientCount) => {
    const limit = getClientLimit();
    return limit === -1 || currentClientCount < limit;
  };

  const hasFeature = (feature) => {
    const tier = getSubscriptionTier();
    const features = {
      free: ['basic_workouts', 'basic_tracking'],
      starter: ['basic_workouts', 'basic_tracking', 'progress_charts'],
      pro: ['basic_workouts', 'basic_tracking', 'progress_charts', 'video_uploads', 'advanced_analytics'],
      elite: ['basic_workouts', 'basic_tracking', 'progress_charts', 'video_uploads', 'advanced_analytics', 'unlimited_clients', 'priority_support'],
    };
    return features[tier]?.includes(feature) || false;
  };

  const getTierInfo = () => {
    const tier = getSubscriptionTier();
    const tiers = {
      free: {
        name: 'Free',
        price: 0,
        clientLimit: 3,
        features: ['Basic workouts', 'Basic tracking'],
      },
      starter: {
        name: 'Starter',
        price: 15,
        clientLimit: 10,
        features: ['Basic workouts', 'Basic tracking', 'Progress charts'],
      },
      pro: {
        name: 'Pro',
        price: 29,
        clientLimit: 25,
        features: ['Basic workouts', 'Basic tracking', 'Progress charts', 'Video uploads', 'Advanced analytics'],
      },
      elite: {
        name: 'Elite',
        price: 49,
        clientLimit: -1,
        features: ['All features', 'Unlimited clients', 'Priority support'],
      },
    };
    return tiers[tier] || tiers.free;
  };

  return {
    subscription,
    loading,
    getSubscriptionTier,
    getClientLimit,
    canAddClient,
    hasFeature,
    getTierInfo,
    refreshSubscription: fetchSubscription,
  };
};

export default useSubscription;