// src/screens/client/ClientDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import InviteService from '../../services/inviteService';
import { supabase } from '../../services/supabase';

export default function ClientDashboardScreen() {
  const [hasCoach, setHasCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkCoachStatus();
  }, []);

  const checkCoachStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasCoach(false);
        return;
      }

      const coachData = await InviteService.getClientCoach(user.id);
      setHasCoach(!!coachData);
    } catch (error) {
      console.error('Error checking coach status:', error);
      setHasCoach(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
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

      const result = await InviteService.acceptInvite(inviteCode, user.id);

      Alert.alert(
        'Connected Successfully!',
        result.message + ' Your streetlifting journey begins now!',
        [{ 
          text: 'Start Training', 
          onPress: () => {
            setInviteCode('');
            checkCoachStatus(); // Refresh the screen
          }
        }]
      );

    } catch (error) {
      console.error('Connection error:', error);
      
      let errorMessage = 'Failed to connect to coach';
      if (error.message.includes('Invalid or expired')) {
        errorMessage = 'This invite code is invalid or has expired.';
      } else if (error.message.includes('already connected')) {
        errorMessage = 'You are already connected to this coach.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show connect screen if no coach
  if (!hasCoach) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BARNATION</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Enter your coach's code</Text>
          <Text style={styles.subtitle}>
            Enter the code provided by your coach to link your accounts.
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="C O A C H - C O D E"
            placeholderTextColor="#404040"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            maxLength={12}
            autoCapitalize="characters"
            textAlign="center"
            letterSpacing={4}
          />

          <TouchableOpacity 
            style={[
              styles.connectButton,
              (!inviteCode.trim() || inviteCode.length < 4) && styles.connectButtonDisabled
            ]}
            onPress={handleConnect}
            disabled={isConnecting || !inviteCode.trim() || inviteCode.length < 4}
          >
            <Text style={styles.connectButtonText}>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => setHasCoach(true)} // Temporarily set to true to show dashboard
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            You can connect with a coach later from your profile
          </Text>
        </View>
      </View>
    );
  }

  // Show main dashboard when they have a coach
  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>TODAY'S SESSION</Text>
        <Text style={styles.dashboardSubtitle}>Ready to lift?</Text>
      </View>

      <View style={styles.dashboardContent}>
        <Text style={styles.emptyStateText}>
          Your coach will assign workouts here.
        </Text>
        <Text style={styles.emptyStateSubtext}>
          Check back soon for your training program!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a4a3a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#d4d4d4',
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#00ff41',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 3,
    textShadowColor: '#00ff41',
    textShadowRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
    maxWidth: 280,
  },
  codeInput: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#404040',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 40,
    width: '100%',
    maxWidth: 300,
  },
  connectButton: {
    backgroundColor: '#00ff41',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginBottom: 24,
  },
  connectButtonDisabled: {
    backgroundColor: '#404040',
  },
  connectButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  skipText: {
    color: '#808080',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  dashboardHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00ff41',
    alignItems: 'center',
  },
  dashboardTitle: {
    color: '#00ff41',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: '#00ff41',
    textShadowRadius: 15,
  },
  dashboardSubtitle: {
    color: '#d4d4d4',
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  dashboardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: '#d4d4d4',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtext: {
    color: '#737373',
    fontSize: 14,
    textAlign: 'center',
  },
});