import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';
import ExerciseCard from '../workout/ExerciseCard';
import ExerciseConfigModal from '../workout/ExerciseConfigModal';

export default function WorkoutTemplatesTab({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', exercises: [] });
  
  // Exercise config modal
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState({
    id: null, name: '', exercise_type: 'weighted',
    sets: [{ reps: '', weight: '', isBodyweight: false }], rest: '', notes: ''
  });

  const typeColors = {
    push: '#FF8C00',
    pull: '#1E90FF',
    legs: '#FFD700',
    other: '#00ff41',
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCoachId(user.id);

      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || '',
      exercises: template.exercises || [],
    });
    setShowEditModal(true);
  };

  const saveTemplate = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Missing Name', 'Please enter a template name');
      return;
    }

    try {
      const { error } = await supabase
        .from('workout_templates')
        .update({
          name: editForm.name,
          description: editForm.description,
          exercises: editForm.exercises,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
      Alert.alert('Success', 'Template updated!');
      setShowEditModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      Alert.alert('Error', 'Failed to update template');
    }
  };

  const deleteTemplate = async (id, name) => {
    Alert.alert(
      'Delete Template',
      `Delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('workout_templates')
                .delete()
                .eq('id', id);

              if (error) throw error;
              loadTemplates();
              Alert.alert('Success', 'Template deleted');
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const useTemplate = (template) => {
    navigation.navigate('CreateWorkout', {
      workoutType: template.type,
      workoutData: {
        name: template.name,
        description: template.description,
        exercises: template.exercises,
      },
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      push: '#FF8C00',
      pull: '#1E90FF',
      legs: '#FFD700',
      other: '#00ff41',
    };
    return colors[type] || colors.other;
  };

  // Exercise editing functions
  const openExerciseModalForEdit = (exercise) => {
    setCurrentExercise({ ...exercise });
    setShowExerciseModal(true);
  };

  const saveCurrentExercise = () => {
    if (!currentExercise.name.trim()) {
      Alert.alert('Missing Info', 'Please enter an exercise name');
      return;
    }
    
    const validSets = currentExercise.sets.filter(set => {
      if (currentExercise.exercise_type === 'duration') {
        return set.duration && set.duration.trim() !== '';
      } else if (currentExercise.exercise_type === 'bodyweight') {
        return set.reps && set.reps.trim() !== '';
      } else {
        return set.reps && set.reps.trim() !== '' && (set.isBodyweight || (set.weight && set.weight.trim() !== ''));
      }
    });
    
    if (validSets.length === 0) {
      const message = currentExercise.exercise_type === 'duration' 
        ? 'Please add at least one set with duration'
        : currentExercise.exercise_type === 'bodyweight'
        ? 'Please add at least one set with reps'
        : 'Please add at least one complete set (reps and weight/BW)';
      Alert.alert('Missing Sets', message);
      return;
    }

    const exerciseToSave = {
      ...currentExercise,
      sets: validSets.map(set => {
        if (currentExercise.exercise_type === 'weighted') {
          return { reps: set.reps, weight: set.isBodyweight ? 'BW' : set.weight, isBodyweight: set.isBodyweight };
        }
        return set;
      }),
    };

    // Update exercise in the exercises array
    const updatedExercises = editForm.exercises.map((ex) => 
      ex.id === currentExercise.id ? exerciseToSave : ex
    );

    setEditForm({ ...editForm, exercises: updatedExercises });
    setCurrentExercise({ 
      id: null, name: '', exercise_type: 'weighted',
      sets: [{ reps: '', weight: '', isBodyweight: false }], rest: '', notes: '' 
    });
    setShowExerciseModal(false);
  };

  const removeExercise = (id) => {
    Alert.alert('Remove Exercise', 'Remove this exercise from template?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedExercises = editForm.exercises.filter((ex) => ex.id !== id);
          setEditForm({ ...editForm, exercises: updatedExercises });
        },
      },
    ]);
  };

  const addSetToCurrentExercise = () => {
    const newSet = currentExercise.exercise_type === 'duration' 
      ? { duration: '' }
      : currentExercise.exercise_type === 'bodyweight'
      ? { reps: '' }
      : { reps: '', weight: '', isBodyweight: false };

    setCurrentExercise({ ...currentExercise, sets: [...currentExercise.sets, newSet] });
  };

  const removeSetFromCurrentExercise = (index) => {
    if (currentExercise.sets.length === 1) {
      Alert.alert('Cannot Remove', 'Exercise must have at least one set');
      return;
    }
    setCurrentExercise({ 
      ...currentExercise, 
      sets: currentExercise.sets.filter((_, i) => i !== index) 
    });
  };

  const updateSetInCurrentExercise = (index, field, value) => {
    const newSets = [...currentExercise.sets];
    if (field === 'reps' || field === 'weight' || field === 'duration') {
      newSets[index][field] = value.replace(/[^0-9]/g, '');
    } else {
      newSets[index][field] = value;
    }
    setCurrentExercise({ ...currentExercise, sets: newSets });
  };

  const toggleBodyweight = (index) => {
    const newSets = [...currentExercise.sets];
    newSets[index].isBodyweight = !newSets[index].isBodyweight;
    if (newSets[index].isBodyweight) newSets[index].weight = '';
    setCurrentExercise({ ...currentExercise, sets: newSets });
  };

  const canSaveExercise = () => {
    if (!currentExercise.name.trim()) return false;
    return currentExercise.sets.some(set => {
      if (currentExercise.exercise_type === 'duration') {
        return set.duration && set.duration.trim() !== '';
      } else if (currentExercise.exercise_type === 'bodyweight') {
        return set.reps && set.reps.trim() !== '';
      } else {
        return set.reps && set.reps.trim() !== '' && (set.isBodyweight || (set.weight && set.weight.trim() !== ''));
      }
    });
  };

  const renderTemplate = ({ item }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.templateDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.templateName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.templateDesc} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.templateStats}>
        <Text style={styles.statText}>
          📋 {item.exercises?.length || 0} exercises
        </Text>
      </View>

      <View style={styles.templateActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.useButton]}
          onPress={() => useTemplate(item)}
        >
          <Text style={styles.useButtonText}>Use Template</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.iconText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.deleteIconButton]}
          onPress={() => deleteTemplate(item.id, item.name)}
        >
          <Text style={styles.iconText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff41" />
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No workout templates</Text>
          <Text style={styles.emptySubtitle}>
            Save workouts as templates when creating them to reuse later
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Edit Template Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Template</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Template Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Upper Body Push Day"
                placeholderTextColor="#737373"
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes..."
                placeholderTextColor="#737373"
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { marginTop: 24 }]}>
                Exercises ({editForm.exercises.length})
              </Text>

              {editForm.exercises.length === 0 ? (
                <View style={styles.noExercises}>
                  <Text style={styles.noExercisesText}>No exercises in template</Text>
                </View>
              ) : (
                editForm.exercises.map((exercise, index) => (
                  <View key={exercise.id} style={{ marginBottom: 12 }}>
                    <ExerciseCard
                      exercise={exercise}
                      index={index}
                      themeColor={getTypeColor(editingTemplate?.type || 'other')}
                      onPress={() => openExerciseModalForEdit(exercise)}
                      onRemove={() => removeExercise(exercise.id)}
                    />
                  </View>
                ))
              )}

              <TouchableOpacity style={styles.saveButton} onPress={saveTemplate}>
                <Text style={styles.saveButtonText}>Update Template</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Exercise Config Modal */}
      <ExerciseConfigModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        themeColor={getTypeColor(editingTemplate?.type || 'other')}
        exercise={currentExercise}
        onUpdateExercise={setCurrentExercise}
        onAddSet={addSetToCurrentExercise}
        onRemoveSet={removeSetFromCurrentExercise}
        onUpdateSet={updateSetInCurrentExercise}
        onToggleBodyweight={toggleBodyweight}
        onSave={saveCurrentExercise}
        onChangeExercise={() => {}} // Not allowing exercise change in template edit
        canSave={canSaveExercise()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  listContent: { padding: 16 },
  templateCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  templateDate: { fontSize: 12, color: '#737373' },
  templateName: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  templateDesc: { fontSize: 14, color: '#737373', marginBottom: 12 },
  templateStats: { marginBottom: 12 },
  statText: { fontSize: 13, color: '#ffffff' },
  templateActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  useButton: { backgroundColor: '#00ff41' },
  useButtonText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconButton: { borderColor: '#ff4444' },
  iconText: { fontSize: 18 },
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
    maxHeight: '90%',
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
  noExercises: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  noExercisesText: { color: '#737373', fontSize: 14 },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#00ff41',
  },
  saveButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
