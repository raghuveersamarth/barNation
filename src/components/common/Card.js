// src/components/common/Card.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#262626',
    shadowColor: '#00ff41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: 10,
  },
});
