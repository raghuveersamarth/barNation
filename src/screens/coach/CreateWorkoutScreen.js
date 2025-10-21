// src/screens/coach/CreateWorkoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { supabase } from '../../services/supabase';
import InviteService from '../../services/inviteService';

export default function CreateWorkoutScreen({ navigation, route }) {
  const workoutType = route.params?.workoutType || 'other';
  const [coachId, setCoachId] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  
  // Workout details
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [exercises, setExercises] = useState([]);
  
  // Exercise being added or edited
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState({
    id: null, // for editing, null when adding new
    name: '',
    sets: [{ reps: '', weight: '' }],
    rest: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCoachData();
    if (route.params?.workoutData) {
      const { exercises: existingExercises, name, description } = route.params.workoutData;
      if (existingExercises) setExercises(existingExercises);
      if (name) setWorkoutName(name);
      if (description) setWorkoutDescription(description);
      if (route.params?.clientId) {
        // To ensure client is preselected
        const client = clients.find(c => c.client.id === route.params.clientId);
        if (client) setSelectedClient(client);
      }
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
      if (route.params?.clientId) {
        const preselected = clientsData.find(c => c.client.id === route.params.clientId);
        if (preselected) {
          setSelectedClient(preselected);
        }
      }
    } catch (error) {
      console.error('Error loading coach data:', error);
      Alert.alert('Error', 'Failed to load coach data');
    } finally {
      setIsLoading(false);
    }
  };

  // Adds or edits exercise
  const saveCurrentExercise = () => {
    if (!currentExercise.name.trim()) {
      Alert.alert('Missing Info', 'Please enter an exercise name');
      return;
    }
    if (currentExercise.id) {
      // Editing existing exercise
      const updated = exercises.map(ex => ex.id === currentExercise.id ? {
        ...currentExercise
      } : ex);
      setExercises(updated);
    } else {
      // Adding new exercise
      const newEx = {
        ...currentExercise,
        id: Date.now().toString(),
        order: exercises.length + 1,
      };
      setExercises([...exercises, newEx]);
    }
    setCurrentExercise({
      id: null,
      name: '',
      sets: [{ reps: '', weight: '' }],
      rest: '',
      notes: '',
    });
    setShowExerciseModal(false);
  };

  const removeExercise = (id) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter(ex => ex.id !== id));
          },
        },
      ]
    );
  };

  const addSetToCurrentExercise = () => {
    setCurrentExercise({
      ...currentExercise,
      sets: [...currentExercise.sets, { reps: '', weight: '' }],
    });
  };

  const removeSetFromCurrentExercise = (index) => {
    if (currentExercise.sets.length === 1) {
      Alert.alert('Cannot Remove', 'Exercise must have at least one set');
      return;
    }
    const newSets = currentExercise.sets.filter((_, i) => i !== index);
    setCurrentExercise({ ...currentExercise, sets: newSets });
  };

  const updateSetInCurrentExercise = (index, field, value) => {
    const newSets = [...currentExercise.sets];
    newSets[index][field] = value;
    setCurrentExercise({ ...currentExercise, sets: newSets });
  };

  // Opens exercise modal with data for editing or empty for new
  const openExerciseModalForEdit = (exercise) => {
    setCurrentExercise({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets || [{ reps: '', weight: '' }],
      rest: exercise.rest || '',
      notes: exercise.notes || '',
    });
    setShowExerciseModal(true);
  };

  const saveWorkout = async () => {
    if (!selectedClient) {
      Alert.alert('Missing Client', 'Please select a client for this workout');
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

    try {
      setIsSaving(true);
      const today = new Date().toISOString().split('T')[0];

      // Insert workout with user_id and client_id & workoutType
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: selectedClient.client.id,
          client_id: selectedClient.client.id,
          coach_id: coachId,
          name: workoutName,
          description: workoutDescription,
          status: 'active',
          type: workoutType,   // save type here
          date: today,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert exercises linked to workout
      const exercisesData = exercises.map(ex => ({
        workout_id: workout.id,
        name: ex.name,
        sets: ex.sets,
        rest_seconds: ex.rest ? parseInt(ex.rest) : null,
        notes: ex.notes,
        order_index: ex.order,
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesData);

      if (exercisesError) throw exercisesError;

      Alert.alert(
        'Success!',
        `Workout "${workoutName}" has been created for ${selectedClient.client.name}`,
        [
          {
            text: 'Create Another',
            onPress: () => {
              setWorkoutName('');
              setWorkoutDescription('');
              setExercises([]);
              setSelectedClient(null);
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
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
        {set.weight ? <Text style={styles.setDetailText}>{set.weight}</Text> : null}
      </View>
    </View>
  );

  const renderExercise = ({ item, index }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => openExerciseModalForEdit(item)} // Open edit modal on tap
    >
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseNumber}>{index + 1}</Text>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <TouchableOpacity onPress={() => removeExercise(item.id)}>
          <Text style={styles.removeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.setsContainer}>
        <Text style={styles.setsLabel}>Sets ({item.sets.length})</Text>
        {item.sets.map(renderSet)}
      </View>
      {item.rest ? <Text style={styles.restText}>⏱️ Rest: {item.rest}s</Text> : null}
      {item.notes ? <Text style={styles.exerciseNotes}>📝 {item.notes}</Text> : null}
    </TouchableOpacity>
  );

  const renderSetInput = ({ item, index }) => (
    <View style={styles.setInputRow} key={index}>
      <Text style={styles.setInputNumber}>Set {index + 1}</Text>
      <TextInput
        style={styles.setInput}
        placeholder="Reps"
        placeholderTextColor="#737373"
        value={item.reps}
        onChangeText={text => updateSetInCurrentExercise(index, 'reps', text)}
      />
      <TextInput
        style={styles.setInput}
        placeholder="Weight"
        placeholderTextColor="#737373"
        value={item.weight}
        onChangeText={text => updateSetInCurrentExercise(index, 'weight', text)}
      />
      {currentExercise.sets.length > 1 && (
        <TouchableOpacity
          onPress={() => removeSetFromCurrentExercise(index)}
          style={styles.removeSetButton}
        >
          <Text style={styles.removeSetButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderClient = ({ item }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => {
        setSelectedClient(item);
        setShowClientModal(false);
      }}
    >
      <Text style={styles.clientName}>{item.client.name}</Text>
      <Text style={styles.clientEmail}>{item.client.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Client Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <TouchableOpacity
            style={styles.clientSelector}
            onPress={() => setShowClientModal(true)}
          >
            {selectedClient ? (
              <>
                <Text style={styles.selectedClientName}>{selectedClient.client.name}</Text>
                <Text style={styles.selectedClientEmail}>{selectedClient.client.email}</Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>Select a client</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Workout Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WORKOUT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Upper Body Strength"
            placeholderTextColor="#737373"
            value={workoutName}
            onChangeText={setWorkoutName}
          />
        </View>

        {/* Workout Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION (OPTIONAL)</Text>
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

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EXERCISES ({exercises.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setCurrentExercise({ // New exercise blank form
                  id: null,
                  name: '',
                  sets: [{ reps: '', weight: '' }],
                  rest: '',
                  notes: '',
                });
                setShowExerciseModal(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Add Exercise</Text>
            </TouchableOpacity>
          </View>
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💪</Text>
              <Text style={styles.emptyText}>No exercises yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Exercise" to get started</Text>
            </View>
          ) : (
            <FlatList
              data={exercises}
              renderItem={renderExercise}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedClient || !workoutName.trim() || exercises.length === 0) && styles.saveButtonDisabled,
          ]}
          onPress={saveWorkout}
          disabled={isSaving || !selectedClient || !workoutName.trim() || exercises.length === 0}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'CREATING WORKOUT...' : 'CREATE WORKOUT'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Client Selection Modal */}
      <Modal
        visible={showClientModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
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
              <FlatList
                data={clients}
                renderItem={renderClient}
                keyExtractor={item => item.client.id}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentExercise.id ? 'Edit Exercise' : 'Add Exercise'}</Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Exercise Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Bench Press"
                placeholderTextColor="#737373"
                value={currentExercise.name}
                onChangeText={text => setCurrentExercise({ ...currentExercise, name: text })}
              />
              <View style={styles.setsSection}>
                <View style={styles.setsSectionHeader}>
                  <Text style={styles.inputLabel}>Sets ({currentExercise.sets.length})</Text>
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={addSetToCurrentExercise}
                  >
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={currentExercise.sets}
                  renderItem={renderSetInput}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                />
              </View>
              <Text style={styles.inputLabel}>Rest Between Sets (seconds)</Text>
              <TextInput
                style={styles.input}
                placeholder="90"
                placeholderTextColor="#737373"
                keyboardType="numeric"
                value={currentExercise.rest}
                onChangeText={text => setCurrentExercise({ ...currentExercise, rest: text })}
              />
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special instructions, form cues..."
                placeholderTextColor="#737373"
                value={currentExercise.notes}
                onChangeText={text => setCurrentExercise({ ...currentExercise, notes: text })}
                multiline
                numberOfLines={2}
              />
              <TouchableOpacity
                style={[styles.modalButton, !currentExercise.name.trim() && styles.modalButtonDisabled]}
                onPress={saveCurrentExercise}
                disabled={!currentExercise.name.trim()}
              >
                <Text style={styles.modalButtonText}>{currentExercise.id ? 'Save Changes' : 'Add Exercise'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Add any missing style definitions or keep your existing ones
const styles = StyleSheet.create({
  // ... Your styles as before ...
  // [Include all styles as in your previous code snippet]
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#262626' },
  backButton: { color: '#00ff41', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#262626' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#00ff41', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  clientSelector: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16 },
  selectedClientName: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  selectedClientEmail: { color: '#737373', fontSize: 14 },
  placeholderText: { color: '#737373', fontSize: 16 },
  input: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, color: '#ffffff', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  addButton: { backgroundColor: '#00ff41', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#737373', fontSize: 14 },
  exerciseCard: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, marginBottom: 12 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseNumber: { backgroundColor: '#00ff41', color: '#000000', fontSize: 14, fontWeight: '700', width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, marginRight: 12 },
  exerciseName: { flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '600' },
  removeButton: { color: '#ff4444', fontSize: 24, fontWeight: '700', padding: 4 },
  setsContainer: { marginTop: 8 },
  setsLabel: { color: '#00ff41', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  setNumber: { backgroundColor: 'rgba(0, 255, 65, 0.2)', borderWidth: 1, borderColor: '#00ff41', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  setNumberText: { color: '#00ff41', fontSize: 12, fontWeight: '700' },
  setDetails: { flexDirection: 'row', flex: 1, gap: 8 },
  setDetailText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  restText: { color: '#a3a3a3', fontSize: 13, marginTop: 8 },
  exerciseNotes: { color: '#a3a3a3', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  saveButton: { backgroundColor: '#00ff41', margin: 20, padding: 18, borderRadius: 8, alignItems: 'center', shadowColor: '#00ff41', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  saveButtonDisabled: { backgroundColor: '#404040', shadowOpacity: 0 },
  saveButtonText: { color: '#000000', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  clientItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#262626' },
  clientName: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  clientEmail: { color: '#737373', fontSize: 14 },
  inputLabel: { color: '#00ff41', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  setsSection: { marginTop: 8 },
  setsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addSetButton: { backgroundColor: 'rgba(0, 255, 65, 0.1)', borderWidth: 1, borderColor: '#00ff41', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addSetButtonText: { color: '#00ff41', fontSize: 12, fontWeight: '700' },
  setInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  setInputNumber: { color: '#ffffff', fontSize: 14, fontWeight: '600', width: 50 },
  setInput: { flex: 1, backgroundColor: '#262626', borderWidth: 1, borderColor: '#404040', borderRadius: 6, padding: 10, color: '#ffffff', fontSize: 14 },
  removeSetButton: { backgroundColor: '#ff4444', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  removeSetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalButton: { backgroundColor: '#00ff41', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  modalButtonDisabled: { backgroundColor: '#404040' },
  modalButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
