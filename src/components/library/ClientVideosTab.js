import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { supabase } from '../../services/supabase';

export default function ClientVideosTab({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, reviewed

  useEffect(() => {
    loadClientVideos();
  }, []);

  const loadClientVideos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get videos from exercise submissions by coach's clients
      const { data, error } = await supabase
        .from('exercise_submissions')
        .select(`
          id,
          video_url,
          notes,
          created_at,
          workout_exercises (
            name,
            workouts (
              name,
              client_id,
              users (name, email)
            )
          )
        `)
        .eq('workouts.coach_id', user.id)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const renderVideo = ({ item }) => (
    <TouchableOpacity style={styles.videoCard}>
      <View style={styles.videoThumbnail}>
        <Text style={styles.playIcon}>▶️</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.exerciseName}>
          {item.workout_exercises?.name || 'Exercise'}
        </Text>
        <Text style={styles.clientName}>
          {item.workout_exercises?.workouts?.users?.name || 'Client'}
        </Text>
        <Text style={styles.videoDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.notes && (
          <Text style={styles.videoNotes} numberOfLines={2}>
            💬 {item.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff41" />
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎥</Text>
          <Text style={styles.emptyTitle}>No client videos yet</Text>
          <Text style={styles.emptySubtitle}>
            Client form check videos will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideo}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  listContent: { padding: 16 },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  videoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playIcon: { fontSize: 32 },
  videoInfo: { flex: 1 },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#00ff41',
    marginBottom: 4,
  },
  videoDate: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 8,
  },
  videoNotes: {
    fontSize: 13,
    color: '#737373',
    fontStyle: 'italic',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#737373', textAlign: 'center' },
});
