import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../../theme';

export default function HistoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Past Workouts</Text>
        <Text style={styles.comingSoon}>Workout history coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.textStyles.h1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.textStyles.h3,
    marginBottom: theme.spacing.md,
  },
  comingSoon: {
    ...theme.typography.textStyles.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
