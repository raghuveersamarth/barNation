// src/screens/coach/CoachDashboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '../../services/supabase';
import InviteService from '../../services/inviteService';

export default function CoachDashboardScreen({ navigation }) {
  const [coachName, setCoachName] = useState('Coach');
  const [recentClients, setRecentClients] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach name
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      setCoachName(userData?.name || 'Coach');

      // Get recent clients
      const clients = await InviteService.getCoachClients(user.id);
      const filteredClients = clients.filter(item => item.client);
      setRecentClients(filteredClients.slice(0, 5));

      // Get completed workouts from coach's clients
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, name, type, client_id, status, created_at, date')
        .eq('coach_id', user.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })
        .limit(20);

      if (workoutsError) {
        console.error('Workouts error:', workoutsError);
      }

      if (workouts && workouts.length > 0) {
        // Get client names and exercise counts
        const clientIds = [...new Set(workouts.map(w => w.client_id))];
        const workoutIds = workouts.map(w => w.id);

        const [clientsData, exercisesData, submissionsData] = await Promise.all([
          supabase.from('users').select('id, name').in('id', clientIds),
          supabase.from('workout_exercises')
            .select('id, workout_id')
            .in('workout_id', workoutIds),
          supabase.from('exercise_submissions')
            .select('id, assigned_workout_id, reviewed_at')
            .in('assigned_workout_id', workoutIds),
        ]);

        const enrichedWorkouts = workouts.map(workout => {
          const client = clientsData.data?.find(c => c.id === workout.client_id);
          const workoutExercises = exercisesData.data?.filter(
            e => e.workout_id === workout.id
          ) || [];
          const workoutSubmissions = submissionsData.data?.filter(
            s => s.assigned_workout_id === workout.id
          ) || [];
          
          const totalExercises = workoutExercises.length;
          const submittedExercises = workoutSubmissions.length;
          const reviewedCount = workoutSubmissions.filter(s => s.reviewed_at).length;
          const needsReview = reviewedCount < submittedExercises;

          return {
            ...workout,
            client,
            totalExercises,
            submittedExercises,
            reviewedCount,
            needsReview,
          };
        });

        setCompletedWorkouts(enrichedWorkouts);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  };

  const getWorkoutTypeStyle = (type) => {
    const typeMap = {
      push: { color: '#FF8C00', name: 'PUSH', icon: '🏋️' },
      pull: { color: '#1E90FF', name: 'PULL', icon: '💪' },
      legs: { color: '#FFD700', name: 'LEGS', icon: '🦵' },
      other: { color: '#00ff41', name: 'OTHER', icon: '🤸' },
    };
    const normalizedType = (type || 'other').toLowerCase();
    return typeMap[normalizedType] || typeMap.other;
  };

  const WorkoutCard = ({ workout }) => {
    const clientName = workout.client?.name || 'Unknown Client';
    const workoutName = workout.name || 'Untitled Workout';
    const typeStyle = getWorkoutTypeStyle(workout.type);

    return (
      <TouchableOpacity
        style={[styles.workoutCard, { borderLeftColor: typeStyle.color }]}
        onPress={() => {
          navigation.navigate('ReviewWorkout', {
            workoutId: workout.id,
            clientId: workout.client_id,
          });
        }}
      >
        <View style={styles.workoutHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeStyle.color }]}>
            <Text style={styles.typeIcon}>{typeStyle.icon}</Text>
            <Text style={styles.typeBadgeText}>{typeStyle.name}</Text>
          </View>
          <Text style={styles.workoutTime}>{getRelativeTime(workout.date)}</Text>
        </View>
        
        <Text style={styles.clientNameText}>{clientName}</Text>
        <Text style={styles.workoutNameText}>{workoutName}</Text>
        
        <View style={styles.workoutFooter}>
          <Text style={styles.exercisesCountText}>
            {workout.submittedExercises}/{workout.totalExercises} exercises completed
          </Text>
          {workout.needsReview ? (
            <View style={styles.needsReviewBadge}>
              <Text style={styles.needsReviewText}>Needs Review</Text>
            </View>
          ) : (
            <View style={styles.reviewedBadge}>
              <Text style={styles.reviewedText}>✓ Reviewed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ClientItem = ({ client }) => {
    const name = client.client?.name || 'Unnamed Client';
    return (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() => navigation.navigate('ClientDetails', { clientId: client.client?.id })}
      >
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {name?.[0]?.toUpperCase() || 'C'}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{name}</Text>
          <Text style={styles.clientActivity}>
            Last active: {getRelativeTime(client.created_at)}
          </Text>
        </View>
        <Text style={styles.clientArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff41" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, Coach {coachName}!</Text>
      </View>

      {/* Assign Workouts Card */}
      <View style={styles.assignCard}>
        <Text style={styles.assignTitle}>Assign workouts to your clients</Text>
        <Text style={styles.assignSubtitle}>
          Get your clients moving and motivated by assigning them personalized workouts
        </Text>
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => navigation.navigate('ChooseWorkoutType')}
        >
          <Text style={styles.assignButtonText}>Assign Workouts</Text>
        </TouchableOpacity>
      </View>

      {/* Completed Workouts Section */}
      <View style={styles.workoutsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Completed Workouts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllWorkouts')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading workouts...</Text>
        ) : completedWorkouts.length > 0 ? (
          completedWorkouts.slice(0, 5).map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))
        ) : (
          <View style={styles.emptyWorkouts}>
            <Text style={styles.emptyWorkoutsIcon}>💪</Text>
            <Text style={styles.emptyWorkoutsText}>No completed workouts yet</Text>
            <Text style={styles.emptyWorkoutsSubtext}>
              Completed workouts will appear here
            </Text>
          </View>
        )}
      </View>

      {/* Clients Section */}
      <View style={styles.clientsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clients</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Clients')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading clients...</Text>
        ) : recentClients.length > 0 ? (
          recentClients.map((client) => (
            <ClientItem
              key={(client.linkId ?? client.client?.id ?? '').toString()}
              client={client}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateText}>No clients yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Invite your first client to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Clients')}
            >
              <Text style={styles.emptyStateButtonText}>Invite Client</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a2820' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  menuButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuIcon: { color: '#ffffff', fontSize: 24 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  placeholder: { width: 40 },
  welcomeSection: { paddingHorizontal: 20, marginBottom: 24 },
  welcomeText: { color: '#ffffff', fontSize: 24, fontWeight: '700', lineHeight: 32 },
  assignCard: { 
    backgroundColor: '#00ff41', 
    marginHorizontal: 20, 
    borderRadius: 16, 
    padding: 24, 
    marginBottom: 32 
  },
  assignTitle: { color: '#000000', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  assignSubtitle: { color: '#1a4a3a', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  assignButton: { backgroundColor: '#0a2820', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  assignButtonText: { color: '#00ff41', fontSize: 16, fontWeight: '700' },
  workoutsSection: { paddingHorizontal: 20, marginBottom: 32 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  viewAllText: { color: '#00ff41', fontSize: 14, fontWeight: '600' },
  workoutCard: {
    backgroundColor: '#0f3529',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  typeIcon: { fontSize: 14 },
  typeBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  workoutTime: { color: '#808080', fontSize: 12 },
  clientNameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutNameText: {
    color: '#00ff41',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exercisesCountText: { color: '#cccccc', fontSize: 13 },
  needsReviewBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  needsReviewText: { color: '#000', fontSize: 11, fontWeight: '700' },
  reviewedBadge: {
    backgroundColor: 'rgba(0, 255, 65, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewedText: { color: '#00ff41', fontSize: 11, fontWeight: '700' },
  emptyWorkouts: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#0f3529',
    borderRadius: 12,
  },
  emptyWorkoutsIcon: { fontSize: 48, marginBottom: 12 },
  emptyWorkoutsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyWorkoutsSubtext: { color: '#808080', fontSize: 14 },
  clientsSection: { paddingHorizontal: 20, paddingBottom: 40 },
  clientItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0f3529', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12 
  },
  clientAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#00ff41', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  clientAvatarText: { color: '#000000', fontSize: 20, fontWeight: '700' },
  clientInfo: { flex: 1 },
  clientName: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  clientActivity: { color: '#808080', fontSize: 13 },
  clientArrow: { color: '#808080', fontSize: 24, fontWeight: '300' },
  loadingText: { color: '#808080', fontSize: 14, textAlign: 'center', padding: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateText: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyStateSubtext: { color: '#808080', fontSize: 14, marginBottom: 24, textAlign: 'center' },
  emptyStateButton: { backgroundColor: '#00ff41', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyStateButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
