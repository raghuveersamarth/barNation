// src/screens/shared/SubscriptionScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../services/supabase';

export default function SubscriptionScreen({ navigation }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const subscriptionTiers = [
    {
      id: 'free',
      name: 'FREE',
      price: '$0',
      period: '/forever',
      features: [
        '3 clients max',
        'Basic workout tracking',
        'Client progress overview',
        'Form video reviews'
      ],
      limitations: [
        'Limited analytics',
        'No advanced charts',
        'Basic support only'
      ]
    },
    {
      id: 'starter',
      name: 'STARTER',
      price: '$19',
      period: '/month',
      popular: true,
      features: [
        '10 clients max',
        'Progress charts & analytics',
        'Custom workout builder',
        'Video form analysis',
        'Email support'
      ],
      limitations: [
        'No advanced integrations',
        'Standard templates only'
      ]
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '$39',
      period: '/month',
      features: [
        'Unlimited clients',
        'Advanced analytics dashboard',
        'Custom program templates',
        'Priority video processing',
        'White-label app option',
        'Priority support'
      ],
      limitations: []
    },
    {
      id: 'elite',
      name: 'ELITE',
      price: '$79',
      period: '/month',
      features: [
        'Everything in Pro',
        'API access for integrations',
        'Custom branding',
        'Dedicated account manager',
        '1-on-1 coaching calls',
        'Beta features access'
      ],
      limitations: []
    }
  ];

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
  };

  const handleContinue = async () => {
    if (!selectedTier) {
      Alert.alert('Select Plan', 'Please choose a subscription tier to continue');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      if (selectedTier.id === 'free') {
        // For free tier, just update the database
        const { error } = await supabase
          .from('users')
          .update({ 
            subscription_tier: 'free',
            subscription_status: 'active'
          })
          .eq('id', user.id);

        if (error) throw error;

        // Force a session refresh to trigger AppNavigator re-render
        await supabase.auth.refreshSession();

        // No alert needed - just let AppNavigator handle the transition
      } else {
        // For paid tiers, integrate with Stripe
        Alert.alert(
          'Coming Soon',
          'Stripe payment integration will be implemented here. For now, you\'ll get the free tier.',
          [{ text: 'Continue', onPress: async () => {
            // Temporarily give them free tier
            await handleFreeTierSetup();
            await supabase.auth.refreshSession();
          }}]
        );
      }

    } catch (error) {
      Alert.alert('Setup Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeTierSetup = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('users')
        .update({ 
          subscription_tier: 'free',
          subscription_status: 'active'
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting up free tier:', error);
    }
  };

  const SubscriptionTierCard = ({ tier }) => (
    <TouchableOpacity
      style={[
        styles.tierCard,
        selectedTier?.id === tier.id && styles.tierCardSelected,
        tier.popular && styles.tierCardPopular
      ]}
      onPress={() => handleTierSelect(tier)}
      activeOpacity={0.8}
    >
      {tier.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      
      <Text style={styles.tierName}>{tier.name}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.tierPrice}>{tier.price}</Text>
        <Text style={styles.tierPeriod}>{tier.period}</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        
        {tier.limitations.map((limitation, index) => (
          <View key={`limit-${index}`} style={styles.featureRow}>
            <Text style={styles.featureX}>✗</Text>
            <Text style={styles.limitationText}>{limitation}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CHOOSE YOUR</Text>
        <Text style={styles.titleGlow}>COACHING TIER</Text>
        <Text style={styles.subtitle}>Select the plan that fits your coaching business</Text>
      </View>

      <View style={styles.tiersContainer}>
        {subscriptionTiers.map((tier) => (
          <SubscriptionTierCard key={tier.id} tier={tier} />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedTier && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isLoading || !selectedTier}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'SETTING UP...' : 'START COACHING'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  titleGlow: {
    color: '#00ff41',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#d4d4d4',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tiersContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  tierCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#262626',
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: '#00ff41',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  tierCardPopular: {
    borderColor: '#00ff41',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    right: 20,
    backgroundColor: '#00ff41',
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  popularText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tierName: {
    color: '#00ff41',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tierPrice: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '800',
  },
  tierPeriod: {
    color: '#737373',
    fontSize: 16,
    fontWeight: '500',
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureCheck: {
    color: '#00ff41',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 12,
    width: 16,
  },
  featureX: {
    color: '#737373',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 12,
    width: 16,
  },
  featureText: {
    color: '#d4d4d4',
    fontSize: 14,
    flex: 1,
  },
  limitationText: {
    color: '#737373',
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#00ff41',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  buttonDisabled: {
    backgroundColor: '#404040',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});