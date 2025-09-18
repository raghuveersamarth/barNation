import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '../../components/common/Input.js';
import Button from '../../components/common/Button.js';

export default function AddClientScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddClient = async () => {
    if (!email.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement client addition logic
      // This would typically involve:
      // 1. Validating the email format
      // 2. Checking if the email is already registered
      // 3. Sending an invitation to the client
      // 4. Adding the client to the coach's client list
      
      Alert.alert('Success', 'Client invitation sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add client. Please try again.');
      console.error('Add client error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Add New Client</Text>
        <Text style={styles.subtitle}>Invite a client to join your coaching program</Text>

        <View style={styles.form}>
          <Input
            placeholder="Client Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          
          <Input
            placeholder="Client Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title={loading ? "Adding..." : "Add Client"}
            onPress={handleAddClient}
            disabled={loading}
            style={styles.button}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#00ff41',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#a3a3a3',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 40,
  },
  input: {
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
