import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../services/supabase';

export default function RoleSelectionScreen({ navigation }) {


    // No local state, just navigate

    async function selectRole(role) {
      //navigate to profile setup with role param
      navigation.navigate('ProfileSetup', { role });
    }

  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Your Role</Text>
      <Text style={styles.subheader}>How will you dominate the underground?</Text>

      <View style={styles.roles}>
        <TouchableOpacity style={styles.card} onPress={() => selectRole('coach')}>
          <Text style={styles.icon}>💪</Text>
          <Text style={styles.title}>Coach</Text>
          <Text style={styles.desc}>Lead lifters to greatness</Text>
          <Text style={styles.features}>
            • Train multiple clients {'\n'}
            • Track progress {'\n'}
            • Review form videos {'\n'}
            • Build programs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => selectRole('client')}>
          <Text style={styles.icon}>🏋️</Text>
          <Text style={styles.title}>Lifter</Text>
          <Text style={styles.desc}>Master the big three</Text>
          <Text style={styles.features}>
            • Follow coach programs {'\n'}
            • Log your lifts {'\n'}
            • Upload form checks {'\n'}
            • Track PRs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#00ff41',
    marginBottom: 6,
    textShadowColor: '#00ff41',
    textShadowRadius: 15,
    textAlign: 'center',
  },
  subheader: {
    color: '#d4d4d4',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'center',
  },
  roles: {
    width: '100%',
    gap: 20,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    borderColor: '#262626',
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#00ff41',
    marginBottom: 8,
  },
  desc: {
    color: '#d4d4d4',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  features: {
    color: '#a3a3a3',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});