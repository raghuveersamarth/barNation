import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, Modal, ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';

export default function ExerciseLibraryTab({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Modal state
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercise_type: 'weighted',
    category: 'accessory',
    muscle_groups: [],
  });

  useEffect(() => {
    loadCoachExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exercises, searchQuery, filter]);

  const loadCoachExercises = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCoachId(user.id);

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = exercises;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.description?.toLowerCase().includes(query)
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(ex => ex.exercise_type === filter);
    }

    setFilteredExercises(filtered);
  };

  const openCreateModal = () => {
    setEditingExercise(null);
    setFormData({
      name: '',
      description: '',
      exercise_type: 'weighted',
      category: 'accessory',
      muscle_groups: [],
    });
    setShowExerciseModal(true);
  };

  const openEditModal = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      exercise_type: exercise.exercise_type,
      category: exercise.category,
      muscle_groups: exercise.muscle_groups || [],
    });
    setShowExerciseModal(true);
  };

  const saveExercise = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Missing Name', 'Please enter an exercise name');
      return;
    }

    try {
      if (editingExercise) {
        // Update existing
        const { error } = await supabase
          .from('exercises')
          .update({
            name: formData.name,
            description: formData.description,
            exercise_type: formData.exercise_type,
            category: formData.category,
            muscle_groups: formData.muscle_groups,
          })
          .eq('id', editingExercise.id)
          .eq('created_by', coachId);

        if (error) throw error;
        Alert.alert('Success', 'Exercise updated!');
      } else {
        // Create new
        const { error } = await supabase
          .from('exercises')
          .insert({
            created_by: coachId,
            name: formData.name,
            description: formData.description,
            exercise_type: formData.exercise_type,
            category: formData.category,
            muscle_groups: formData.muscle_groups,
            is_public: false,
          });

        if (error) throw error;
        Alert.alert('Success', 'Exercise created!');
      }

      setShowExerciseModal(false);
      loadCoachExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', 'Failed to save exercise: ' + error.message);
    }
  };

  const deleteExercise = async (id, name) => {
    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('exercises')
                .delete()
                .eq('id', id)
                .eq('created_by', coachId);

              if (error) throw error;
              loadCoachExercises();
              Alert.alert('Success', 'Exercise deleted');
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  const renderExercise = ({ item }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailText}>{item.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.exerciseDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.tags}>
            <Text style={styles.typeTag}>{item.exercise_type}</Text>
            <Text style={styles.categoryTag}>{item.category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.exerciseActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteExercise(item.id, item.name)}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'weighted', label: 'Weighted' },
    { id: 'bodyweight', label: 'Bodyweight' },
    { id: 'duration', label: 'Duration' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your exercises..."
          placeholderTextColor="#737373"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterPill, filter === f.id && styles.activeFilterPill]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.activeFilterText]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <Text style={styles.createButtonText}>+ Create New Exercise</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff41" />
        </View>
      ) : filteredExercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💪</Text>
          <Text style={styles.emptyTitle}>No exercises yet</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different search' : 'Create your first custom exercise'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          renderItem={renderExercise}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={showExerciseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExercise ? 'Edit Exercise' : 'Create Exercise'}
              </Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Exercise Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Cable Fly"
                placeholderTextColor="#737373"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes..."
                placeholderTextColor="#737373"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Exercise Type</Text>
              <View style={styles.typeRow}>
                {['weighted', 'bodyweight', 'duration'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      formData.exercise_type === type && styles.activeTypeButton
                    ]}
                    onPress={() => setFormData({ ...formData, exercise_type: type })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.exercise_type === type && styles.activeTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.typeRow}>
                {['powerlifting', 'streetlifting', 'accessory'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.typeButton,
                      formData.category === cat && styles.activeTypeButton
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.category === cat && styles.activeTypeText
                    ]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveExercise}>
                <Text style={styles.saveButtonText}>
                  {editingExercise ? 'Update Exercise' : 'Create Exercise'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 14 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
  },
  activeFilterPill: { backgroundColor: '#00ff41', borderColor: '#00ff41' },
  filterText: { color: '#737373', fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: '#000000' },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#00ff41',
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  exerciseCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  exerciseHeader: { flexDirection: 'row', marginBottom: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbnailText: { fontSize: 24, fontWeight: '700', color: '#00ff41' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  exerciseDesc: { fontSize: 13, color: '#737373', marginBottom: 8 },
  tags: { flexDirection: 'row', gap: 8 },
  typeTag: {
    fontSize: 11,
    color: '#00ff41',
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  categoryTag: {
    fontSize: 11,
    color: '#737373',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  exerciseActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  deleteButton: { borderColor: '#ff4444' },
  actionButtonText: { fontSize: 13, color: '#ffffff', fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#737373', textAlign: 'center' },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#00ff41' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#00ff41', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#262626',
    alignItems: 'center',
  },
  activeTypeButton: { backgroundColor: '#00ff41', borderColor: '#00ff41' },
  typeButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  activeTypeText: { color: '#000000' },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#00ff41',
  },
  saveButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
