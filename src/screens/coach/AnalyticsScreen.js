import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import theme from '../../theme';

export default function AnalyticsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Coach Analytics</Text>
        <Text style={styles.comingSoon}>Advanced analytics coming soon...</Text>
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
