import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../services/supabase';

function formatYMD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CoachDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [message, setMessage] = useState('');

  const fetchTodayWorkout = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = user?.id;
      if (!userId) throw new Error('No session');

      // Example schema assumptions:
      // - workouts table: id, user_id, date (YYYY-MM-DD), title
      // - workout_exercises table: id, workout_id, name, sets, reps, weight
      const today = formatYMD();
      const { data: workouts, error: wErr } = await supabase
        .from('workouts')
        .select('id, title')
        .eq('user_id', userId)
        .eq('date', today)
        .limit(1);
      if (wErr) throw wErr;

      if (!workouts || workouts.length === 0) {
        setExercises([]);
        setMessage("No workout assigned for today.");
        return;
      }

      const workoutId = workouts[0].id;
      const { data: rows, error: eErr } = await supabase
        .from('workout_exercises')
        .select('id, name, sets, reps, weight')
        .eq('workout_id', workoutId)
        .order('id');
      if (eErr) throw eErr;
      setExercises(rows ?? []);
      if (!rows || rows.length === 0) {
        setMessage('Workout has no exercises yet.');
      }
    } catch (err) {
      setMessage(err.message ?? 'Failed to fetch workout');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayWorkout();
  }, [fetchTodayWorkout]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayWorkout();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#b3ff00" />
        <Text style={styles.hint}>Loading today\'s workout…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>Sets: {item.sets}  Reps: {item.reps}  Weight: {item.weight ?? '-'} kg</Text>
          </View>
        )}
        ListEmptyComponent={!message ? (
          <Text style={styles.hint}>No exercises to display.</Text>
        ) : null}
        contentContainerStyle={exercises.length === 0 ? styles.centerPad : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  centerPad: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: '#b3ff00',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  detail: {
    color: '#ccc',
  },
  hint: {
    color: '#888',
    marginTop: 8,
  },
});


