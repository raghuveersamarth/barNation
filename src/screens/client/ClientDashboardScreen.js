import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export default function ClientDashboardScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Color scheme based on workout type string
  const getWorkoutTypeStyle = (type) => {
    const typeMap = {
      'push': { color: '#FF8C00', icon: '🏋️', name: 'PUSH' }, // Orange
      'pull': { color: '#1E90FF', icon: '💪', name: 'PULL' }, // Blue
      'legs': { color: '#FFD700', icon: '🦵', name: 'LEGS' }, // Yellow/Gold
      'other': { color: '#00ff41', icon: '🤸', name: 'OTHER' }, // Green
    };
    
    const normalizedType = (type || 'other').toLowerCase();
    return typeMap[normalizedType] || typeMap['other'];
  };

  useEffect(() => {
    fetchAssignedWorkouts();
  }, []);

  const fetchAssignedWorkouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Simple fetch - just get workouts with type column
      let { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (progress, color) => (
    <View style={styles.progressBackground}>
      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );

  const renderWorkoutCard = ({ item }) => {
    // Get workout type styling from the type column
    const typeStyle = getWorkoutTypeStyle(item.type);
    const typeColor = typeStyle.color;
    const typeIcon = typeStyle.icon;
    const typeName = typeStyle.name;

    // Calculate progress
    const progress = item.progress ?? (item.status === 'completed' ? 100 : item.status === 'in_progress' ? 50 : 0);
    
    const statusText =
      progress === 100
        ? 'Completed'
        : progress === 0
          ? 'Not Started'
          : `In Progress: ${progress}%`;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { 
            borderColor: typeColor,
            shadowColor: typeColor,
          }
        ]}
        onPress={() => {
          navigation.navigate('WorkoutDetail', {
            workoutId: item.id,
            assignedWorkout: item
          });
        }}
        activeOpacity={0.8}
      >
        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={styles.typeName}>{typeName}</Text>
        </View>

        {/* Workout Title */}
        <Text style={styles.cardTitle}>{item.name || 'Untitled Workout'}</Text>

        {/* Status & Progress */}
        <View style={styles.statusRow}>
          <Text style={[styles.cardStatus, { color: typeColor }]}>{statusText}</Text>
        </View>
        
        {renderProgressBar(progress, typeColor)}

        {/* Description (if exists) */}
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.cardButton,
            { backgroundColor: typeColor },
            progress === 100 && styles.cardButtonDisabled,
          ]}
          disabled={progress === 100}
          onPress={() => {
            navigation.navigate('WorkoutDetail', {
              workoutId: item.id,
              assignedWorkout: item
            });
          }}
        >
          <Text style={styles.cardButtonText}>
            {progress === 0
              ? 'Start'
              : progress === 100
                ? 'View Results'
                : 'Continue Workout'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff41" />
        <Text style={styles.loadingText}>Loading your workouts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.dashboardContainer}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>CRAZY.</Text>
        <Text style={styles.dashboardSubtitle}>Your Assigned Workouts</Text>
      </View>

      {/* Workout List */}
      <FlatList
        data={workouts}
        renderItem={renderWorkoutCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💪</Text>
            <Text style={styles.emptyStateText}>No workouts assigned yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your coach will assign workouts here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#999', fontSize: 16, marginTop: 12 },
  dashboardHeader: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#0a0a0a' },
  dashboardTitle: { color: '#ffffff', fontSize: 32, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  dashboardSubtitle: { color: '#666', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  card: { backgroundColor: '#141414', borderRadius: 20, marginBottom: 20, padding: 20, borderWidth: 2, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, gap: 6 },
  typeIcon: { fontSize: 16 },
  typeName: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { color: '#fff', fontWeight: '800', fontSize: 22, marginBottom: 12, letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardStatus: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  progressBackground: { width: '100%', height: 8, backgroundColor: '#1a1a1a', borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  progressBar: { height: 8, borderRadius: 8 },
  cardDescription: { color: '#999', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  cardButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cardButtonDisabled: { backgroundColor: '#404040' },
  cardButtonText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateText: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptyStateSubtext: { color: '#666', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
