import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressCircle } from 'react-native-svg-charts';

export default function RingChartComponent({ percentage }) {
  return (
    <View style={styles.container}>
      <ProgressCircle
        style={{ height: 120 }}
        progress={percentage / 100}
        progressColor="#00ff41"
        backgroundColor="#262626"
        strokeWidth={10}
      />
      <Text style={styles.percentText}>{percentage}%</Text>
      <Text style={styles.label}>Monthly Completion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  percentText: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff41',
  },
  label: {
    marginTop: 8,
    color: '#a3a3a3',
    fontSize: 14,
  },
});
