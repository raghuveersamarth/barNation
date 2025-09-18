// src/screens/auth/CoachConnectionScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../../services/supabase';

export default function CoachConnectionScreen({ navigation }) {
  const [inviteCode, setInviteCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectToCoach = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Missing Code', 'Please enter your coach\'s invite code');
      return;
    }

    if (inviteCode.length < 4) {
      Alert.alert('Invalid Code', 'Invite code must be at least 4 characters');
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Look up the invite code to find the coach
      const { data: inviteData, error: inviteError } = await supabase
        .from('coach_invites')
        .select(`
          id,
          coach_id,
          coaches:coach_id (
            id,
            name,
            email
          )
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteError) {
        throw inviteError;
      }

      if (!inviteData) {
        Alert.alert(
          'Invalid Code', 
          'This invite code is not valid or has already been used. Please check with your coach and try again.'
        );
        return;
      }

      // Connect the client to the coach by setting coach_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          coach_id: inviteData.coach_id,
          connected_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Mark the invite as used
      const { error: inviteUpdateError } = await supabase
        .from('coach_invites')
        .update({ 
          status: 'accepted',
          used_by: user.id, // Track which client used the code
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteData.id);

      if (inviteUpdateError) {
        console.warn('Warning: Could not update invite status:', inviteUpdateError);
      }

      // Success! The AppNavigator will automatically detect the change and show ClientApp
      Alert.alert(
        'Connected Successfully!',
        `You are now connected to coach ${inviteData.coaches.name}. Your streetlifting journey begins now!`,
        [{ text: 'Start Training', style: 'default' }]
      );

    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect to coach');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🏋️‍♂️</Text>
        <Text style={styles.title}>COACH REQUIRED</Text>
        <Text style={styles.subtitle}>Connect with your streetlifting coach</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcomeText}>
          <Text style={styles.welcomeBold}>Welcome to BarNation!</Text>
          {'\n\n'}
          To start your streetlifting journey, you need a coach to guide your training and track your progress.
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Find Your Coach</Text>
              <Text style={styles.stepDesc}>Contact a streetlifting coach you want to train with</Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Request Invite</Text>
              <Text style={styles.stepDesc}>Ask them to send you an invitation through their coach dashboard</Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Enter Code</Text>
              <Text style={styles.stepDesc}>Use the invite code they provide to connect your accounts</Text>
            </View>
          </View>
        </View>

        <View style={styles.inviteSection}>
          <Text style={styles.inviteLabel}>HAVE AN INVITE CODE?</Text>
          <TextInput
            style={styles.inviteInput}
            placeholder="ENTER CODE HERE"
            placeholderTextColor="#404040"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            maxLength={12}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.connectButton,
            (!inviteCode.trim() || inviteCode.length < 4) && styles.buttonDisabled
          ]}
          onPress={handleConnectToCoach}
          disabled={isConnecting || !inviteCode.trim() || inviteCode.length < 4}
        >
          <Text style={[
            styles.connectButtonText,
            (!inviteCode.trim() || inviteCode.length < 4) && styles.buttonTextDisabled
          ]}>
            {isConnecting ? 'CONNECTING...' : 'CONNECT TO COACH'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← BACK TO SETUP</Text>
        </TouchableOpacity>

        <View style={styles.warningSection}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>No Coach Yet?</Text>
            <Text style={styles.warningText}>
              Reach out to local streetlifting communities or gyms to find experienced coaches who can help you master the big three lifts safely.
            </Text>
          </View>
        </View>
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
  headerIcon: {
    fontSize: 64,
    marginBottom: 20,
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    color: '#00ff41',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: '#00ff41',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  subtitle: {
    color: '#d4d4d4',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1,
  },
  card: {
    margin: 20,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#00ff41',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#d4d4d4',
    marginBottom: 32,
    textAlign: 'center',
  },
  welcomeBold: {
    color: '#ffffff',
    fontWeight: '700',
  },
  stepsContainer: {
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 255, 65, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff41',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00ff41',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  stepNumberText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDesc: {
    color: '#a3a3a3',
    fontSize: 13,
    lineHeight: 18,
  },
  inviteSection: {
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00ff41',
  },
  inviteLabel: {
    color: '#00ff41',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  inviteInput: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 16,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3,
  },
  connectButton: {
    backgroundColor: '#00ff41',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
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
  connectButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonTextDisabled: {
    color: '#737373',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  warningSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffa500',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: '#ffa500',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    color: '#ffa500',
    fontSize: 13,
    lineHeight: 18,
  },
});