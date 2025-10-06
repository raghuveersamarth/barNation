// src/screens/shared/SubscriptionScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export default function SubscriptionScreen({ navigation }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const subscriptionTiers = [
    { id: 'free', name: 'FREE', price: '$0', period: '/forever', features: ['3 clients max','Basic workout tracking','Client progress overview','Form video reviews'], limitations: ['Limited analytics','No advanced charts','Basic support only'] },
    { id: 'starter', name: 'STARTER', price: '$19', period: '/month', popular: true, features: ['10 clients max','Progress charts & analytics','Custom workout builder','Video form analysis','Email support'], limitations: ['No advanced integrations','Standard templates only'] },
    { id: 'pro', name: 'PRO', price: '$39', period: '/month', features: ['Unlimited clients','Advanced analytics dashboard','Custom program templates','Priority video processing','White-label app option','Priority support'], limitations: [] },
    { id: 'elite', name: 'ELITE', price: '$79', period: '/month', features: ['Everything in Pro','API access for integrations','Custom branding','Dedicated account manager','1-on-1 coaching calls','Beta features access'], limitations: [] }
  ];

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
  };

  // Function to fetch user profile to decide navigation
  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, role, profile_complete, subscription_tier, subscription_status')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

const handleContinue = async () => {
  if (!selectedTier) {
    Alert.alert("Select Plan", "Please choose a subscription tier to continue");
    return;
  }

  setIsLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user");

    // Update subscription
    await supabase
      .from("users")
      .update({ subscription_tier: selectedTier.id, subscription_status: "active" })
      .eq("id", user.id);

    // Fetch updated profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("role, profile_complete, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    // Navigate to correct app
    if (userProfile.role === "coach") {
      navigation.reset({
        index: 0,
        routes: [{ name: "CoachApp" }],
      });
    } else if (userProfile.role === "client") {
      navigation.reset({
        index: 0,
        routes: [{ name: "ClientApp" }],
      });
    }
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setIsLoading(false);
  }
};


  const SubscriptionTierCard = ({ tier }) => (
    <TouchableOpacity
      style={[
        styles.tierCard,
        selectedTier?.id === tier.id && styles.tierCardSelected,
        tier.popular && styles.tierCardPopular,
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
          style={[styles.continueButton, (!selectedTier || isLoading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedTier || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.continueButtonText}>START COACHING</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isLoading}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, marginBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: 2, color: '#fff', textAlign: 'center' },
  titleGlow: { fontSize: 26, fontWeight: '800', letterSpacing: 2, color: '#00ff41', textAlign: 'center', textShadowColor: '#00ff41', textShadowRadius: 20 },
  subtitle: { fontSize: 14, color: '#d4d4d4', marginTop: 8, textAlign: 'center', letterSpacing: 1 },
  tiersContainer: { paddingHorizontal: 20 },
  tierCard: { backgroundColor: '#141414', borderRadius: 16, padding: 24, borderWidth: 2, borderColor: '#262626', marginBottom: 20 },
  tierCardSelected: { borderColor: '#00ff41', shadowColor: '#00ff41', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  tierCardPopular: { borderColor: '#00ff41' },
  popularBadge: { position: 'absolute', top: -10, left: 20, backgroundColor: '#00ff41', paddingVertical: 4, borderRadius: 20, alignItems: 'center', paddingHorizontal: 8 },
  popularText: { fontSize: 11, fontWeight: '800', color: '#000', letterSpacing: 1 },
  tierName: { fontSize: 22, fontWeight: '800', letterSpacing: 2, color: '#00ff41', textAlign: 'center', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 24 },
  tierPrice: { color: '#fff', fontSize: 36, fontWeight: '800' },
  tierPeriod: { color: '#737373', fontSize: 16, marginLeft: 8 },
  featuresContainer: { marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureCheck: { color: '#00ff41', fontSize: 16, width: 20 },
  featureText: { fontSize: 14, color: '#d4d4d4' },
  limitationText: { fontSize: 14, color: '#737373', marginLeft: 4 },
  buttonContainer: { padding: 20 },
  continueButton: {
    backgroundColor: '#00ff41',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  buttonDisabled: { backgroundColor: '#404040', shadowOpacity: 0 },
  continueButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 1, color: '#000' },
  backButton: { paddingVertical: 16, alignItems: 'center' },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#737373', letterSpacing: 1 }
});
