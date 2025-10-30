// src/screens/coach/CreateWorkoutScreen.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, Switch,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../../services/supabase';
import InviteService from '../../services/inviteService';

// Import components
import ClientSelectionModal from '../../components/workout/ClientSelectionModal';
import ExerciseCard from '../../components/workout/ExerciseCard';
import ExerciseLibraryModal from '../../components/workout/ExerciseLibraryModal';
import ExerciseConfigModal from '../../components/workout/ExerciseConfigModal';
import CustomExerciseModal from '../../components/workout/CustomExerciseModal';

export default function CreateWorkoutScreen({ navigation, route }) {
  const workoutType = route.params?.workoutType || 'other';
  const [coachId, setCoachId] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [exercises, setExercises] = useState([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);

  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
const [customExercise, setCustomExercise] = useState({
  name: '', description: '', exercise_type: 'weighted', category: 'accessory'
});
const [saveCustomToLibrary, setSaveCustomToLibrary] = useState(true); // ADD THIS


  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState({
    id: null, name: '', exercise_type: 'weighted',
    sets: [{ reps: '', weight: '', isBodyweight: false }], rest: '', notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const typeColors = { push: '#FF8C00', pull: '#1E90FF', legs: '#FFD700', other: '#00ff41' };
  const workoutTypeKey = workoutType.toLowerCase();
  const themeColor = typeColors[workoutTypeKey] || typeColors.other;

  

  const WORKOUT_MUSCLE_MAP = {
    push: ['chest', 'shoulders', 'triceps', 'pectorals'],
    pull: ['back', 'biceps', 'lats', 'traps', 'rear delts'],
    legs: ['quads', 'hamstrings', 'glutes', 'calves', 'quadriceps'],
    other: [],
  };

  useEffect(() => {
    loadCoachData();
    if (route.params?.workoutData) {
      const { exercises: existingExercises, name, description } = route.params.workoutData;
      if (existingExercises) setExercises(existingExercises);
      if (name) setWorkoutName(name);
      if (description) setWorkoutDescription(description);
    }
  }, []);

  const loadCoachData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'No authenticated user found'); return; }
      setCoachId(user.id);
      const clientsData = await InviteService.getCoachClients(user.id);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading coach data:', error);
      Alert.alert('Error', 'Failed to load coach data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExerciseLibrary = async () => {
    setLoadingLibrary(true);
    try {
      let query = supabase.from('exercises')
        .select('id, name, description, thumbnail_url, category, muscle_groups, exercise_type')
        .order('name');
      if (coachId) { query = query.or(`is_public.eq.true,created_by.eq.${coachId}`); }
      else { query = query.eq('is_public', true); }
      const { data, error } = await query;
      if (error) throw error;
      setExerciseLibrary(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercise library');
    } finally {
      setLoadingLibrary(false);
    }
  };

  const normalizeText = useCallback((str) => {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }, []);

  const filteredExercises = useMemo(() => {
    let filtered = exerciseLibrary;
    const relevantMuscles = WORKOUT_MUSCLE_MAP[workoutTypeKey] || [];

    if (searchQuery.trim()) {
      const query = normalizeText(searchQuery);
      const queryWords = query.split(' ');
      filtered = exerciseLibrary.filter((exercise) => {
        const exerciseName = normalizeText(exercise.name);
        const exerciseDesc = normalizeText(exercise.description || '');
        const muscleGroups = exercise.muscle_groups?.map(m => normalizeText(m)).join(' ') || '';
        const category = normalizeText(exercise.category || '');
        const searchableText = `${exerciseName} ${exerciseDesc} ${muscleGroups} ${category}`;
        return queryWords.every(word => searchableText.includes(word));
      });
      filtered.sort((a, b) => {
        const aRelevant = a.muscle_groups?.some(mg => relevantMuscles.some(rm => normalizeText(mg).includes(rm)));
        const bRelevant = b.muscle_groups?.some(mg => relevantMuscles.some(rm => normalizeText(mg).includes(rm)));
        if (aRelevant && !bRelevant) return -1;
        if (!aRelevant && bRelevant) return 1;
        const aName = normalizeText(a.name);
        const bName = normalizeText(b.name);
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (!aName.startsWith(query) && bName.startsWith(query)) return 1;
        return aName.localeCompare(bName);
      });
    } else if (!showAllExercises) {
      if (relevantMuscles.length > 0) {
        filtered = exerciseLibrary.filter(ex => {
          return ex.muscle_groups?.some(mg => relevantMuscles.some(rm => normalizeText(mg).includes(rm)));
        });
      }
    }
    return filtered;
  }, [exerciseLibrary, searchQuery, showAllExercises, normalizeText, workoutTypeKey]);

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    setShowAllExercises(text.trim().length > 0);
  }, []);

  const selectExerciseFromLibrary = useCallback((exercise) => {
    const initialSet = exercise.exercise_type === 'duration' 
      ? { duration: '' } : exercise.exercise_type === 'bodyweight'
      ? { reps: '' } : { reps: '', weight: '', isBodyweight: false };
    setCurrentExercise({
      id: null, name: exercise.name, exercise_type: exercise.exercise_type,
      sets: [initialSet], rest: '', notes: '',
    });
    setShowExerciseLibrary(false);
    setShowExerciseModal(true);
    setSearchQuery('');
    setShowAllExercises(false);
  }, []);

  const openExerciseLibrary = useCallback(() => {
    if (!coachId) { Alert.alert('Error', 'Loading user data...'); return; }
    loadExerciseLibrary();
    setShowExerciseLibrary(true);
    setSearchQuery('');
    setShowAllExercises(false);
  }, [coachId]);

  const closeExerciseLibrary = useCallback(() => {
    setShowExerciseLibrary(false);
    setSearchQuery('');
    setShowAllExercises(false);
  }, []);

  const openCustomExerciseModal = useCallback(() => {
    setShowExerciseLibrary(false);
    setShowCustomExerciseModal(true);
  }, []);

const saveCustomExercise = async () => {
  if (!customExercise.name.trim()) {
    Alert.alert('Missing Name', 'Please enter an exercise name');
    return;
  }

  try {
    let exerciseData = null;

    // Save to library if checkbox is checked
    if (saveCustomToLibrary) {
      const { data, error } = await supabase.from('exercises').insert({
        created_by: coachId,
        name: customExercise.name,
        description: customExercise.description,
        exercise_type: customExercise.exercise_type,
        category: customExercise.category,
        muscle_groups: [],
        is_public: false,
      }).select().single();

      if (error) throw error;
      exerciseData = data;
      
      // Reload library so it appears in search
      loadExerciseLibrary();
    }

    // Create initial set based on exercise type
    const initialSet = customExercise.exercise_type === 'duration' 
      ? { duration: '' }
      : customExercise.exercise_type === 'bodyweight'
      ? { reps: '' }
      : { reps: '', weight: '', isBodyweight: false };

    // Automatically open exercise config modal with the new exercise
    setCurrentExercise({
      id: null,
      name: customExercise.name,
      exercise_type: customExercise.exercise_type,
      sets: [initialSet],
      rest: '',
      notes: '',
      exerciseLibraryId: exerciseData?.id, // Store reference if saved to library
    });

    // Close custom exercise modal and open config modal
    setCustomExercise({ 
      name: '', 
      description: '', 
      exercise_type: 'weighted', 
      category: 'accessory' 
    });
    setSaveCustomToLibrary(true); // Reset to default
    setShowCustomExerciseModal(false);
    setShowExerciseModal(true);

    if (saveCustomToLibrary) {
      Alert.alert('Success', 'Exercise saved to your library!');
    }
  } catch (error) {
    console.error('Error creating custom exercise:', error);
    Alert.alert('Error', 'Failed to create exercise: ' + error.message);
  }
};


  const changeExercise = useCallback(() => {
    setShowExerciseModal(false);
    openExerciseLibrary();
  }, [openExerciseLibrary]);

  const toggleClientSelection = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
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
    if (currentExercise.id) {
      setExercises(exercises.map((ex) => (ex.id === currentExercise.id ? exerciseToSave : ex)));
    } else {
      setExercises([...exercises, { ...exerciseToSave, id: Date.now().toString(), order: exercises.length + 1 }]);
    }
    setCurrentExercise({ 
      id: null, name: '', exercise_type: 'weighted',
      sets: [{ reps: '', weight: '', isBodyweight: false }], rest: '', notes: '' 
    });
    setShowExerciseModal(false);
  };

  const removeExercise = (id) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setExercises(exercises.filter((ex) => ex.id !== id)) },
    ]);
  };

  const addSetToCurrentExercise = () => {
    const newSet = currentExercise.exercise_type === 'duration' 
      ? { duration: '' } : currentExercise.exercise_type === 'bodyweight'
      ? { reps: '' } : { reps: '', weight: '', isBodyweight: false };
    setCurrentExercise({ ...currentExercise, sets: [...currentExercise.sets, newSet] });
  };

  const removeSetFromCurrentExercise = (index) => {
    if (currentExercise.sets.length === 1) {
      Alert.alert('Cannot Remove', 'Exercise must have at least one set');
      return;
    }
    setCurrentExercise({ ...currentExercise, sets: currentExercise.sets.filter((_, i) => i !== index) });
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

  const openExerciseModalForEdit = (exercise) => {
    setCurrentExercise({ ...exercise });
    setShowExerciseModal(true);
  };

  const saveWorkout = async () => {
    if (selectedClients.length === 0) {
      Alert.alert('Missing Clients', 'Please select at least one client.');
      return;
    }
    if (!workoutName.trim()) {
      Alert.alert('Missing Name', 'Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise');
      return;
    }
    setIsSaving(true);
    try {
      if (saveAsTemplate) {
        await supabase.from('workout_templates').insert({
          coach_id: coachId, name: workoutName, description: workoutDescription,
          type: workoutTypeKey, exercises: exercises,
        });
      }
      const today = new Date().toISOString().split('T')[0];
      for (const clientId of selectedClients) {
        const { data: workout, error: workoutError } = await supabase.from('workouts').insert({
          user_id: clientId, client_id: clientId, coach_id: coachId, name: workoutName,
          description: workoutDescription, status: 'not_started', type: workoutTypeKey, date: today,
        }).select().single();
        if (workoutError) throw workoutError;
        const exercisesData = exercises.map((ex, idx) => ({
          workout_id: workout.id, name: ex.name, exercise_type: ex.exercise_type, sets: ex.sets,
          rest_seconds: ex.rest ? parseInt(ex.rest) : null, notes: ex.notes, order_index: idx + 1,
        }));
        const { error: exercisesError } = await supabase.from('workout_exercises').insert(exercisesData);
        if (exercisesError) throw exercisesError;
      }
      const successMsg = saveAsTemplate 
        ? `Workout sent to ${selectedClients.length} client(s) and saved as template!`
        : `Workout sent to ${selectedClients.length} client(s)`;
      Alert.alert('Success!', successMsg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: themeColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: themeColor }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColor }]}>Create Workout</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>SELECT CLIENT(S)</Text>
            <TouchableOpacity 
              style={[styles.clientSelector, { borderColor: themeColor }]} 
              onPress={() => setShowClientModal(true)}
            >
              <Text style={styles.selectorText}>
                {selectedClients.length === 0
                  ? 'Select Clients'
                  : `${selectedClients.length} Client${selectedClients.length > 1 ? 's' : ''} Selected`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>WORKOUT NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Upper Body Strength"
              placeholderTextColor="#737373"
              value={workoutName}
              onChangeText={setWorkoutName}
            />
            <Text style={[styles.sectionTitle, { marginTop: 20, color: themeColor }]}>
              DESCRIPTION (OPTIONAL)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this workout..."
              placeholderTextColor="#737373"
              value={workoutDescription}
              onChangeText={setWorkoutDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.exercisesHeader}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, color: themeColor }]}>
                EXERCISES
              </Text>
              <TouchableOpacity 
                style={[styles.addExerciseButton, { backgroundColor: themeColor }]} 
                onPress={openExerciseLibrary}
              >
                <Text style={styles.addExerciseButtonText}>+ Select Exercise</Text>
              </TouchableOpacity>
            </View>

            {exercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <Text style={styles.emptyExercisesText}>No exercises added yet</Text>
              </View>
            ) : (
              exercises.map((item, index) => (
                <ExerciseCard
                  key={item.id}
                  exercise={item}
                  index={index}
                  themeColor={themeColor}
                  onPress={() => openExerciseModalForEdit(item)}
                  onRemove={() => removeExercise(item.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.templateSection}>
          <View style={styles.templateRow}>
            <Text style={styles.templateText}>Save as template for future use</Text>
            <Switch
              value={saveAsTemplate}
              onValueChange={setSaveAsTemplate}
              trackColor={{ false: '#404040', true: themeColor + '80' }}
              thumbColor={saveAsTemplate ? themeColor : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: themeColor }, isSaving && styles.saveButtonDisabled]} 
          onPress={saveWorkout} 
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Send Workout'}</Text>
        </TouchableOpacity>

        {/* Modals */}
        <ClientSelectionModal
          visible={showClientModal}
          clients={clients}
          selectedClients={selectedClients}
          onToggleClient={toggleClientSelection}
          onClose={() => setShowClientModal(false)}
          themeColor={themeColor}
        />

        <ExerciseLibraryModal
          visible={showExerciseLibrary}
          onClose={closeExerciseLibrary}
          themeColor={themeColor}
          exercises={filteredExercises}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          showAllExercises={showAllExercises}
          onShowAll={() => setShowAllExercises(true)}
          loading={loadingLibrary}
          onSelectExercise={selectExerciseFromLibrary}
          onCreateCustom={openCustomExerciseModal}
        />

        <ExerciseConfigModal
          visible={showExerciseModal}
          onClose={() => setShowExerciseModal(false)}
          themeColor={themeColor}
          exercise={currentExercise}
          onUpdateExercise={setCurrentExercise}
          onAddSet={addSetToCurrentExercise}
          onRemoveSet={removeSetFromCurrentExercise}
          onUpdateSet={updateSetInCurrentExercise}
          onToggleBodyweight={toggleBodyweight}
          onSave={saveCurrentExercise}
          onChangeExercise={changeExercise}
          canSave={canSaveExercise()}
        />

<CustomExerciseModal
  visible={showCustomExerciseModal}
  onClose={() => {
    setShowCustomExerciseModal(false);
    setSaveCustomToLibrary(true); // Reset when closing
  }}
  themeColor={themeColor}
  exercise={customExercise}
  saveToLibrary={saveCustomToLibrary}
  onToggleSaveToLibrary={setSaveCustomToLibrary}
  onUpdate={setCustomExercise}
  onSave={saveCustomExercise}
/>

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1,
  },
  backButton: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#262626' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  exercisesHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  addExerciseButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addExerciseButtonText: { color: '#000', fontSize: 14, fontWeight: '700' },
  emptyExercises: { paddingVertical: 40, alignItems: 'center' },
  emptyExercisesText: { color: '#737373', fontSize: 14 },
  clientSelector: { backgroundColor: '#141414', borderWidth: 2, borderRadius: 8, padding: 16 },
  selectorText: { color: '#ccc', fontSize: 14 },
  input: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, color: '#ffffff', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  templateSection: {
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#141414',
    borderTopWidth: 1, borderTopColor: '#262626',
  },
  templateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  templateText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  saveButton: { margin: 20, padding: 18, borderRadius: 8, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#404040' },
  saveButtonText: { color: '#000000', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
