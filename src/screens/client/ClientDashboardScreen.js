import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export default function ClientDashboardScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const getWorkoutTypeStyle = (type) => {
    const typeMap = {
      'push': { color: '#FF8C00', icon: '🏋️', name: 'PUSH' },
      'pull': { color: '#1E90FF', icon: '💪', name: 'PULL' },
      'legs': { color: '#FFD700', icon: '🦵', name: 'LEGS' },
      'other': { color: '#00ff41', icon: '🤸', name: 'OTHER' },
    };
    const normalizedType = (type || 'other').toLowerCase();
    return typeMap[normalizedType] || typeMap['other'];
  };

  useEffect(() => {
    fetchAssignedWorkouts();
  }, []);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAssignedWorkouts();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAssignedWorkouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Fetch workouts with status
      let { data: workoutsData, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check progress for each workout
      const workoutsWithStatus = await Promise.all(
        workoutsData.map(async (workout) => {
          // Count total exercises in workout
          const { count: totalExercises } = await supabase
            .from('workout_exercises')
            .select('*', { count: 'exact', head: true })
            .eq('workout_id', workout.id);

          // Count submitted exercises
          const { count: submittedExercises } = await supabase
            .from('exercise_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_workout_id', workout.id)
            .eq('client_id', user.id);

          // Calculate progress based on submissions
          const actualProgress = totalExercises > 0 ? Math.round((submittedExercises / totalExercises) * 100) : 0;
          
          // Get status from database
          const status = workout.status || 'not_started';
          
          // Only show 100% if status is 'completed'
          const displayProgress = status === 'completed' ? 100 : actualProgress;
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress' && actualProgress > 0;

          return {
            ...workout,
            status,
            isCompleted,
            isInProgress,
            progress: displayProgress,
            totalExercises,
            submittedExercises,
          };
        })
      );

      setWorkouts(workoutsWithStatus || []);
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
    const typeStyle = getWorkoutTypeStyle(item.type);
    const typeColor = typeStyle.color;
    const typeIcon = typeStyle.icon;
    const typeName = typeStyle.name;

    const progress = item.progress || 0;
    const isCompleted = item.isCompleted;
    const isInProgress = item.isInProgress;
    
    // Status text based on actual status
    const statusText = isCompleted
      ? '✓ Completed'
      : isInProgress
        ? `In Progress: ${item.submittedExercises} / ${item.totalExercises} exercises`
        : 'Not Started';

    // Button text
    const buttonText = isCompleted
      ? 'View Results'
      : isInProgress
        ? 'Continue Workout'
        : 'Start Workout';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { 
            borderColor: typeColor,
            shadowColor: typeColor,
          },
          isCompleted && styles.cardCompleted,
        ]}
        onPress={() => {
          navigation.navigate('WorkoutDetail', {
            workoutId: item.id,
            assignedWorkout: item
          });
        }}
        activeOpacity={0.8}
      >
        {/* Status Badges */}
        {isCompleted && (
          <View style={[styles.statusBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.statusBadgeText}>✓ COMPLETED</Text>
          </View>
        )}
        {isInProgress && !isCompleted && (
          <View style={[styles.statusBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.statusBadgeText}>⏸ IN PROGRESS</Text>
          </View>
        )}

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

        {/* Description */}
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
            isCompleted && styles.cardButtonCompleted,
          ]}
          onPress={() => {
            navigation.navigate('WorkoutDetail', {
              workoutId: item.id,
              assignedWorkout: item
            });
          }}
        >
          <Text style={styles.cardButtonText}>{buttonText}</Text>
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
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>CRAZY.</Text>
        <Text style={styles.dashboardSubtitle}>Your Assigned Workouts</Text>
      </View>

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
  cardCompleted: { opacity: 0.85 },
  statusBadge: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    zIndex: 10,
  },
  statusBadgeText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
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
  cardButtonCompleted: { opacity: 0.7 },
  cardButtonText: { color: '#000', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateText: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptyStateSubtext: { color: '#666', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
