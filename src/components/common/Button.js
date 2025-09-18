// src/components/common/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Button({ title, onPress, disabled, variant = 'primary' }) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.button, styles.primary, disabled && styles.disabled];
      case 'secondary':
        return [styles.button, styles.secondary];
      case 'ghost':
        return [styles.button, styles.ghost];
      default:
        return [styles.button, styles.primary];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.text, styles.primaryText];
      case 'secondary':
        return [styles.text, styles.secondaryText];
      case 'ghost':
        return [styles.text, styles.ghostText];
      default:
        return [styles.text, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  primary: {
    backgroundColor: '#00ff41',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 10,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff41',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: '#404040',
    shadowOpacity: 0,
  },
  text: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  primaryText: {
    color: '#000000',
  },
  secondaryText: {
    color: '#00ff41',
  },
  ghostText: {
    color: '#737373',
  },
});
