// src/components/common/Input.js
import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export default function Input({ value, onChangeText, placeholder, secureTextEntry, keyboardType, ...props }) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#737373"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      {...props}
      accessibilityLabel={placeholder}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1a1a1a',
    color: '#eaffd0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#262626',
    fontSize: 16,
  },
});
