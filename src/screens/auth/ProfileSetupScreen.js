import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { supabase } from '../../services/supabase';
import Input from '../../components/common/Input.js';
import Button from '../../components/common/Button.js';

export default function ProfileSetupScreen({ navigation, route }) {
  const { role } = route.params;
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleProfileSetup = async () => {
  if (!name || !age || !gender) {
    Alert.alert('Missing Info', 'Please fill in all fields');
    return;
  }
  setIsLoading(true);

  try {
    // Get logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError;

    // Build update object
    const updateData = {
      role,
      name,
      age: parseInt(age, 10),
      gender,
      profile_complete: true,
    };

    // If client, enforce subscription_tier = null
    if (role === 'client') {
      updateData.subscription_tier = null;
    }

    // Update row
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Navigate depending on role
    if (role === 'coach') {
      navigation.navigate('Subscription'); 
    } else {
      navigation.navigate('CoachConnection'); 
    }
  } catch (err) {
    Alert.alert('Setup Failed', err.message ?? 'Unknown error');
  } finally {
    setIsLoading(false);
  }
};



  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.header}>{role === 'coach' ? 'Coach Profile' : 'Lifter Profile'}</Text>
      <Text style={styles.subheader}>Tell us about yourself</Text>

      <Input placeholder="Full Name" value={name} onChangeText={setName} />
      <Input placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Gender:</Text>
        <View style={styles.genderButtons}>
          {['Male', 'Female', 'Other'].map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.genderButton, gender === option.toLowerCase() && styles.genderActive]}
              onPress={() => setGender(option.toLowerCase())}
            >
              <Text style={[styles.genderText, gender === option.toLowerCase() && styles.genderTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button title={isLoading ? 'Setting Up...' : 'Complete Setup'} onPress={handleProfileSetup} disabled={isLoading} />
      <Button title="Back" onPress={() => navigation.goBack()} variant="ghost" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 28 },
  header: {
    fontSize: 24,
    color: '#00ff41',
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: '#00ff41',
    textShadowRadius: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  subheader: { color: '#d4d4d4', fontSize: 14, marginBottom: 24, textAlign: 'center' },
  genderContainer: { marginBottom: 16, width: '100%', maxWidth: 340 },
  genderLabel: { color: '#d4d4d4', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  genderButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderActive: { borderColor: '#00ff41', backgroundColor: 'rgba(0,255,65,0.1)' },
  genderText: { color: '#737373', fontWeight: '600' },
  genderTextActive: { color: '#00ff41' },
});
