// src/screens/coach/CreateWorkoutScreen.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { supabase } from '../../services/supabase';
import InviteService from '../../services/inviteService';

// Optimized exercise item component
const ExerciseLibraryItem = React.memo(({ item, themeColor, onSelect }) => (
  <TouchableOpacity
    style={styles.libraryExerciseItem}
    onPress={() => onSelect(item)}
  >
    <View style={styles.exerciseThumbnail}>
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: themeColor + '20' }]}>
          <Text style={[styles.thumbnailText, { color: themeColor }]}>
            {item.name.charAt(0)}
          </Text>
        </View>
      )}
    </View>
    <View style={styles.exerciseInfo}>
      <Text style={styles.libraryExerciseName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.libraryExerciseDesc} numberOfLines={1}>
          {item.description}
        </Text>
      )}
      <View style={styles.exerciseTags}>
        <Text style={[styles.categoryTag, { borderColor: themeColor, color: themeColor }]}>
          {item.category}
        </Text>
        {item.muscle_groups && item.muscle_groups.length > 0 && (
          <Text style={styles.muscleTag}>{item.muscle_groups[0]}</Text>
        )}
      </View>
    </View>
    <Text style={[styles.selectIcon, { color: themeColor }]}>→</Text>
  </TouchableOpacity>
));

// Draggable modal component (Reanimated v3)
// Simplified draggable modal that actually works
// Non-gesture version (tap to close)
// Pull-down-to-dismiss modal component
const DraggableModal = ({ visible, onClose, children }) => {
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow downward drag
      const newTranslateY = startY.value + event.translationY;
      translateY.value = Math.max(0, newTranslateY);
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 150 || event.velocityY > 500;
      
      if (shouldClose) {
        // Animate out and close
        translateY.value = withSpring(1000, {}, (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
      } else {
        // Snap back to original position
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset position when modal opens
  React.useEffect(() => {
    if (visible) {
      translateY.value = 0;
      startY.value = 0;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContent, animatedStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};



export default function CreateWorkoutScreen({ navigation, route }) {
  const workoutType = route.params?.workoutType || 'other';
  const [coachId, setCoachId] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);

  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [exercises, setExercises] = useState([]);

  // Exercise library state
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState({
    id: null,
    name: '',
    sets: [{ reps: '', weight: '', isBodyweight: false }],
    rest: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const typeColors = {
    push: '#FF8C00',
    pull: '#1E90FF',
    legs: '#FFD700',
    other: '#00ff41',
  };

  const workoutTypeKey = workoutType.toLowerCase();
  const themeColor = typeColors[workoutTypeKey] || typeColors.other;

  // Main exercises (shown by default)
  const MAIN_EXERCISES = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
    'Weighted Pull-ups', 'Weighted Dips', 'Weighted Muscle-ups',
    'Pull-ups', 'Dips', 'Muscle-ups'
  ];

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
      if (!user) {
        Alert.alert('Error', 'No authenticated user found');
        return;
      }
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

  // Load exercise library
  const loadExerciseLibrary = async () => {
    setLoadingLibrary(true);
    try {
      let query = supabase
        .from('exercises')
        .select('id, name, description, thumbnail_url, category, muscle_groups')
        .order('name');

      if (coachId) {
        query = query.or(`is_public.eq.true,created_by.eq.${coachId}`);
      } else {
        query = query.eq('is_public', true);
      }

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

  // Normalize text for searching
  const normalizeText = useCallback((str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Filtered and sorted exercises (memoized)
  const filteredExercises = useMemo(() => {
    let filtered = exerciseLibrary;

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
        const aName = normalizeText(a.name);
        const bName = normalizeText(b.name);
        const aStartsWith = aName.startsWith(query);
        const bStartsWith = bName.startsWith(query);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return aName.localeCompare(bName);
      });
    } else if (!showAllExercises) {
      filtered = exerciseLibrary.filter(ex => MAIN_EXERCISES.includes(ex.name));
    }

    return filtered;
  }, [exerciseLibrary, searchQuery, showAllExercises, normalizeText]);

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    setShowAllExercises(text.trim().length > 0);
  }, []);

  const selectExerciseFromLibrary = useCallback((exercise) => {
    setCurrentExercise({
      id: null,
      name: exercise.name,
      sets: [{ reps: '', weight: '', isBodyweight: false }],
      rest: '',
      notes: '',
    });
    setShowExerciseLibrary(false);
    setShowExerciseModal(true);
    setSearchQuery('');
    setShowAllExercises(false);
  }, []);

  const openExerciseLibrary = useCallback(() => {
    if (!coachId) {
      Alert.alert('Error', 'Loading user data...');
      return;
    }
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
    
    const hasValidSet = currentExercise.sets.some(set => {
      const hasReps = set.reps.trim() !== '';
      const hasWeight = set.isBodyweight || set.weight.trim() !== '';
      return hasReps && hasWeight;
    });
    
    return hasValidSet;
  };

  const saveCurrentExercise = () => {
    if (!currentExercise.name.trim()) {
      Alert.alert('Missing Info', 'Please enter an exercise name');
      return;
    }
    
    const validSets = currentExercise.sets.filter(set => {
      const hasReps = set.reps.trim() !== '';
      const hasWeight = set.isBodyweight || set.weight.trim() !== '';
      return hasReps && hasWeight;
    });
    
    if (validSets.length === 0) {
      Alert.alert('Missing Sets', 'Please add at least one complete set (reps and weight)');
      return;
    }

    const exerciseToSave = {
      ...currentExercise,
      sets: validSets.map(set => ({
        reps: set.reps,
        weight: set.isBodyweight ? 'BW' : set.weight,
        isBodyweight: set.isBodyweight,
      })),
    };

    if (currentExercise.id) {
      setExercises(exercises.map((ex) => (ex.id === currentExercise.id ? exerciseToSave : ex)));
    } else {
      setExercises([
        ...exercises,
        { ...exerciseToSave, id: Date.now().toString(), order: exercises.length + 1 },
      ]);
    }
    setCurrentExercise({ id: null, name: '', sets: [{ reps: '', weight: '', isBodyweight: false }], rest: '', notes: '' });
    setShowExerciseModal(false);
  };

  const removeExercise = (id) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setExercises(exercises.filter((ex) => ex.id !== id)),
      },
    ]);
  };

  const addSetToCurrentExercise = () => {
    setCurrentExercise({
      ...currentExercise,
      sets: [...currentExercise.sets, { reps: '', weight: '', isBodyweight: false }],
    });
  };

  const removeSetFromCurrentExercise = (index) => {
    if (currentExercise.sets.length === 1) {
      Alert.alert('Cannot Remove', 'Exercise must have at least one set');
      return;
    }
    setCurrentExercise({
      ...currentExercise,
      sets: currentExercise.sets.filter((_, i) => i !== index),
    });
  };

  const updateSetInCurrentExercise = (index, field, value) => {
    const newSets = [...currentExercise.sets];
    
    if (field === 'reps' || field === 'weight') {
      const numericValue = value.replace(/[^0-9]/g, '');
      newSets[index][field] = numericValue;
    } else {
      newSets[index][field] = value;
    }
    
    setCurrentExercise({ ...currentExercise, sets: newSets });
  };

  const toggleBodyweight = (index) => {
    const newSets = [...currentExercise.sets];
    newSets[index].isBodyweight = !newSets[index].isBodyweight;
    if (newSets[index].isBodyweight) {
      newSets[index].weight = '';
    }
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
      const today = new Date().toISOString().split('T')[0];
      for (const clientId of selectedClients) {
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: clientId,
            client_id: clientId,
            coach_id: coachId,
            name: workoutName,
            description: workoutDescription,
            status: 'not_started',
            type: workoutTypeKey,
            date: today,
          })
          .select()
          .single();
        if (workoutError) throw workoutError;

        const exercisesData = exercises.map((ex, idx) => ({
          workout_id: workout.id,
          name: ex.name,
          sets: ex.sets.map(set => ({
            reps: set.reps,
            weight: set.isBodyweight ? 'BW' : set.weight,
          })),
          rest_seconds: ex.rest ? parseInt(ex.rest) : null,
          notes: ex.notes,
          order_index: idx + 1,
        }));

        const { error: exercisesError } = await supabase.from('workout_exercises').insert(exercisesData);
        if (exercisesError) throw exercisesError;
      }
      Alert.alert('Success!', `Workout sent to ${selectedClients.length} client(s)`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSet = (set, index) => (
    <View key={index} style={styles.setRow}>
      <View style={styles.setNumber}>
        <Text style={styles.setNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.setDetails}>
        {set.reps ? <Text style={styles.setDetailText}>{set.reps} reps</Text> : null}
        <Text style={styles.setDetailText}>{set.isBodyweight ? 'BW' : (set.weight ? `${set.weight}kg` : '')}</Text>
      </View>
    </View>
  );

  const renderExercise = ({ item, index }) => (
    <TouchableOpacity style={styles.exerciseCard} onPress={() => openExerciseModalForEdit(item)}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseNumber, { backgroundColor: themeColor }]}>{index + 1}</Text>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <TouchableOpacity onPress={() => removeExercise(item.id)}>
          <Text style={styles.removeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.setsContainer}>
        <Text style={[styles.setsLabel, { color: themeColor }]}>Sets ({item.sets.length})</Text>
        {item.sets.map(renderSet)}
      </View>
      {item.rest ? <Text style={styles.restText}>⏱️ Rest: {item.rest}s</Text> : null}
      {item.notes ? <Text style={styles.exerciseNotes}>📝 {item.notes}</Text> : null}
    </TouchableOpacity>
  );

  const renderSetInput = ({ item, index }) => (
    <View key={index} style={styles.setInputRow}>
      <Text style={styles.setInputNumber}>Set {index + 1}</Text>
      <TextInput
        style={styles.setInput}
        placeholder="Reps"
        placeholderTextColor="#737373"
        value={item.reps}
        onChangeText={(text) => updateSetInCurrentExercise(index, 'reps', text)}
        keyboardType="numeric"
      />
      {!item.isBodyweight ? (
        <TextInput
          style={styles.setInput}
          placeholder="Weight (kg)"
          placeholderTextColor="#737373"
          value={item.weight}
          onChangeText={(text) => updateSetInCurrentExercise(index, 'weight', text)}
          keyboardType="numeric"
        />
      ) : (
        <View style={[styles.setInput, styles.bwLabel]}>
          <Text style={[styles.bwText, { color: themeColor }]}>BW</Text>
        </View>
      )}
      <TouchableOpacity 
        style={[
          styles.bwToggle, 
          { borderColor: themeColor },
          item.isBodyweight && { backgroundColor: themeColor }
        ]}
        onPress={() => toggleBodyweight(index)}
      >
        <Text style={[styles.bwToggleText, { color: themeColor }, item.isBodyweight && { color: '#000' }]}>BW</Text>
      </TouchableOpacity>
      {currentExercise.sets.length > 1 && (
        <TouchableOpacity onPress={() => removeSetFromCurrentExercise(index)} style={styles.removeSetButton}>
          <Text style={styles.removeSetButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderClient = ({ item }) => {
    const isSelected = selectedClients.includes(item.client.id);
    return (
      <TouchableOpacity style={[styles.clientItem, isSelected && { backgroundColor: themeColor }]} onPress={() => toggleClientSelection(item.client.id)}>
        <Text style={[styles.clientName, isSelected && { color: '#000' }]}>{item.client.name}</Text>
        <Text style={[styles.clientEmail, isSelected && { color: '#000' }]}>{item.client.email}</Text>
      </TouchableOpacity>
    );
  };

  const renderLibraryExercise = useCallback(({ item }) => (
    <ExerciseLibraryItem
      item={item}
      themeColor={themeColor}
      onSelect={selectExerciseFromLibrary}
    />
  ), [themeColor, selectExerciseFromLibrary]);

  const keyExtractor = useCallback((item) => item.id, []);

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
            <TouchableOpacity style={[styles.clientSelector, { borderColor: themeColor }]} onPress={() => setShowClientModal(true)}>
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
            <Text style={[styles.sectionTitle, { marginTop: 20, color: themeColor }]}>DESCRIPTION (OPTIONAL)</Text>
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
              <Text style={[styles.sectionTitle, { marginBottom: 0, color: themeColor }]}>EXERCISES</Text>
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
                <View key={item.id}>
                  {renderExercise({ item, index })}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColor }, isSaving && styles.saveButtonDisabled]} onPress={saveWorkout} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Send Workout'}</Text>
        </TouchableOpacity>

        <Modal visible={showClientModal} transparent animationType="slide" onRequestClose={() => setShowClientModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColor }]}>Select Clients</Text>
                <TouchableOpacity onPress={() => setShowClientModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {clients.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No clients yet</Text>
                  <Text style={styles.emptySubtext}>Invite clients to get started</Text>
                </View>
              ) : (
                <FlatList data={clients} renderItem={renderClient} keyExtractor={(item) => item.client.id} />
              )}
            </View>
          </View>
        </Modal>

        <DraggableModal visible={showExerciseLibrary} onClose={closeExerciseLibrary}>
          <View style={styles.swipeIndicator}>
            <View style={styles.swipeHandle} />
          </View>

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColor }]}>Exercise Library</Text>
            <TouchableOpacity onPress={closeExerciseLibrary}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {!searchQuery.trim() && !showAllExercises && (
            <TouchableOpacity 
              style={[styles.showAllButton, { borderColor: themeColor }]}
              onPress={() => setShowAllExercises(true)}
            >
              <Text style={[styles.showAllText, { color: themeColor }]}>
                Show All Exercises ({exerciseLibrary.length})
              </Text>
            </TouchableOpacity>
          )}

          {loadingLibrary ? (
            <View style={styles.loadingLibrary}>
              <ActivityIndicator size="large" color={themeColor} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              renderItem={renderLibraryExercise}
              keyExtractor={keyExtractor}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No exercises found</Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery ? 'Try a different search term' : 'No exercises available'}
                  </Text>
                </View>
              }
            />
          )}
        </DraggableModal>

        <Modal visible={showExerciseModal} transparent animationType="slide" onRequestClose={() => setShowExerciseModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColor }]}>
                  {currentExercise.id ? 'Edit Exercise' : 'Add Exercise'}
                </Text>
                <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                <TouchableOpacity 
                  style={[styles.input, styles.exerciseNameDisplay]}
                  onPress={changeExercise}
                >
                  <Text style={styles.exerciseNameText}>{currentExercise.name}</Text>
                  <Text style={[styles.changeExerciseText, { color: themeColor }]}>Change →</Text>
                </TouchableOpacity>

                <View style={styles.setsSectionHeader}>
                  <Text style={[styles.inputLabel, { color: themeColor }]}>Sets ({currentExercise.sets.length})</Text>
                  <TouchableOpacity 
                    style={[styles.addSetButton, { backgroundColor: themeColor }]} 
                    onPress={addSetToCurrentExercise}
                  >
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
                
                {currentExercise.sets.map((item, index) => renderSetInput({ item, index }))}

                <Text style={[styles.inputLabel, { color: themeColor }]}>Rest Between Sets (seconds)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="90"
                  placeholderTextColor="#737373"
                  keyboardType="numeric"
                  value={currentExercise.rest}
                  onChangeText={(text) => setCurrentExercise({ ...currentExercise, rest: text.replace(/[^0-9]/g, '') })}
                />
                <Text style={[styles.inputLabel, { color: themeColor }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Special instructions, form cues..."
                  placeholderTextColor="#737373"
                  value={currentExercise.notes}
                  onChangeText={(text) => setCurrentExercise({ ...currentExercise, notes: text })}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity
                  style={[styles.modalButton, !canSaveExercise() && styles.modalButtonDisabled, { backgroundColor: themeColor }]}
                  onPress={saveCurrentExercise}
                  disabled={!canSaveExercise()}
                >
                  <Text style={styles.modalButtonText}>{currentExercise.id ? 'Save Changes' : 'Add Exercise'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#262626' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyExercises: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyExercisesText: {
    color: '#737373',
    fontSize: 14,
  },
  clientSelector: { backgroundColor: '#141414', borderWidth: 2, borderRadius: 8, padding: 16 },
  selectorText: { color: '#ccc', fontSize: 14 },
  input: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, color: '#ffffff', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  exerciseNameDisplay: {
    backgroundColor: '#262626',
    borderColor: '#404040',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNameText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  changeExerciseText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#737373', fontSize: 14 },
  exerciseCard: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, marginBottom: 12 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseNumber: { color: '#000000', fontSize: 14, fontWeight: '700', width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, marginRight: 12 },
  exerciseName: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '600' },
  removeButton: { color: '#ff4444', fontSize: 24, fontWeight: '700', padding: 4 },
  setsContainer: { marginTop: 8 },
  setsLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  setNumber: { backgroundColor: 'rgba(0, 255, 65, 0.2)', borderWidth: 1, borderColor: '#00ff41', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  setNumberText: { color: '#00ff41', fontSize: 12, fontWeight: '700' },
  setDetails: { flexDirection: 'row', flex: 1, gap: 8 },
  setDetailText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  restText: { color: '#a3a3a3', fontSize: 13, marginTop: 8 },
  exerciseNotes: { color: '#a3a3a3', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  saveButton: { margin: 20, padding: 18, borderRadius: 8, alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  saveButtonDisabled: { backgroundColor: '#404040', shadowOpacity: 0 },
  saveButtonText: { color: '#000000', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  swipeIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  clientItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#262626' },
  clientName: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  clientEmail: { color: '#737373', fontSize: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  setsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addSetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addSetButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  setInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  setInputNumber: { color: '#ffffff', fontSize: 14, fontWeight: '600', width: 50 },
  setInput: { flex: 1, backgroundColor: '#262626', borderWidth: 1, borderColor: '#404040', borderRadius: 6, padding: 10, color: '#ffffff', fontSize: 14 },
  bwLabel: { justifyContent: 'center', alignItems: 'center' },
  bwText: { fontSize: 14, fontWeight: '700' },
  bwToggle: {
    backgroundColor: '#262626',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bwToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  removeSetButton: { backgroundColor: '#ff4444', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  removeSetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  modalButtonDisabled: { backgroundColor: '#404040' },
  modalButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearSearch: {
    color: '#737373',
    fontSize: 20,
    padding: 4,
  },
  showAllButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loadingLibrary: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#737373',
    fontSize: 14,
    marginTop: 12,
  },
  libraryExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  exerciseThumbnail: {
    marginRight: 12,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 24,
    fontWeight: '700',
  },
  exerciseInfo: {
    flex: 1,
  },
  libraryExerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  libraryExerciseDesc: {
    color: '#737373',
    fontSize: 13,
    marginBottom: 6,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  muscleTag: {
    fontSize: 10,
    color: '#737373',
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
});
