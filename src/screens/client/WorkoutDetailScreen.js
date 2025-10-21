import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { supabase } from '../../services/supabase';

export default function WorkoutDetailScreen({ route, navigation }) {
  const assignedWorkout = route.params?.assignedWorkout;

  const [loading, setLoading] = useState(true);
  const [cardExercises, setCardExercises] = useState([]);
  const [progress, setProgress] = useState(0);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [exerciseToLog, setExerciseToLog] = useState(null);
  const [logInput, setLogInput] = useState({ sets: '', reps: '', weight: '', notes: '' });
  const [completedExercises, setCompletedExercises] = useState({});

  // Color scheme based on workout type string
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
    loadWorkoutExercises();
  }, []);

  const loadWorkoutExercises = async () => {
    setLoading(true);
    try {
      // Fetch exercises for the workout
      let { data: exercises } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', assignedWorkout.id)
        .order('order_index', { ascending: true });

      setCardExercises(exercises || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading workout:', err);
      setLoading(false);
    }
  };

  const openLogModal = (exercise) => {
    setExerciseToLog(exercise);
    setLogInput({ sets: '', reps: '', weight: '', notes: '' });
    setLogModalVisible(true);
  };

  const handleLogExercise = () => {
    setCompletedExercises({
      ...completedExercises,
      [exerciseToLog.id]: { ...logInput }
    });
    setLogModalVisible(false);
    updateProgress();
  };

  const updateProgress = () => {
    const total = cardExercises.length;
    const complete = Object.keys(completedExercises).length + 1;
    setProgress(Math.round((complete / total) * 100));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  // Get styling from workout type
  const typeStyle = getWorkoutTypeStyle(assignedWorkout.type);
  const typeColor = typeStyle.color;
  const typeIcon = typeStyle.icon;
  const typeName = typeStyle.name;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Workout Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {/* Workout Card Header */}
        <View style={[styles.cardHeader, { borderColor: typeColor, shadowColor: typeColor }]}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={styles.workoutName}>{assignedWorkout.name}</Text>
          <Text style={[styles.workoutType, { color: typeColor }]}>{typeName}</Text>
          {assignedWorkout.description ? (
            <Text style={styles.description}>{assignedWorkout.description}</Text>
          ) : null}
        </View>

        {/* Progress Section */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressPercent, { color: typeColor }]}>{progress}%</Text>
          </View>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { backgroundColor: typeColor, width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {Object.keys(completedExercises).length} of {cardExercises.length} exercises completed
          </Text>
        </View>

        {/* Exercise List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>EXERCISES</Text>
          <FlatList
            data={cardExercises}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              const logged = completedExercises[item.id];
              const isCompleted = !!logged;

              return (
                <View style={[
                  styles.exerciseCard,
                  isCompleted && { borderColor: typeColor, borderWidth: 2 }
                ]}>
                  {/* Exercise Header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNumberContainer}>
                      <View style={[styles.exerciseNumber, { backgroundColor: typeColor }]}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exerciseTitleContainer}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        {isCompleted && (
                          <Text style={[styles.completedBadge, { color: typeColor }]}>✓ Logged</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Target Parameters from sets JSONB */}
                  {item.sets && Array.isArray(item.sets) && item.sets.length > 0 && (
                    <View style={styles.targetContainer}>
                      <View style={styles.targetChip}>
                        <Text style={styles.targetLabel}>Target:</Text>
                        <Text style={styles.targetValue}>{item.sets.length} sets</Text>
                      </View>
                      {item.rest_seconds && (
                        <View style={styles.targetChip}>
                          <Text style={styles.targetLabel}>Rest:</Text>
                          <Text style={styles.targetValue}>{item.rest_seconds}s</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Coach Notes */}
                  {item.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>💬 Coach Notes:</Text>
                      <Text style={styles.notesText}>{item.notes}</Text>
                    </View>
                  )}

                  {/* Logged Data Display */}
                  {logged && (
                    <View style={[styles.loggedContainer, { backgroundColor: typeColor + '15' }]}>
                      <Text style={styles.loggedTitle}>Your Performance:</Text>
                      <View style={styles.loggedDetails}>
                        {logged.sets && <Text style={styles.loggedText}>Sets: {logged.sets}</Text>}
                        {logged.reps && <Text style={styles.loggedText}>Reps: {logged.reps}</Text>}
                        {logged.weight && <Text style={styles.loggedText}>Weight: {logged.weight} kg</Text>}
                      </View>
                      {logged.notes && (
                        <Text style={styles.loggedNotes}>Notes: {logged.notes}</Text>
                      )}
                    </View>
                  )}

                  {/* Log Button */}
                  <TouchableOpacity
                    style={[
                      styles.logButton,
                      isCompleted 
                        ? { backgroundColor: '#404040' }
                        : { backgroundColor: typeColor }
                    ]}
                    onPress={() => openLogModal(item)}
                  >
                    <Text style={styles.logButtonText}>
                      {isCompleted ? 'Edit Log' : 'Log Exercise'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>

        {/* Complete Workout Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            progress === 100
              ? { backgroundColor: typeColor }
              : { backgroundColor: '#404040' }
          ]}
          disabled={progress < 100}
          onPress={() => {
            alert('Workout completed! 🎉');
          }}
        >
          <Text style={styles.completeButtonText}>
            {progress === 100 ? '✓ Complete Workout' : `Complete ${cardExercises.length - Object.keys(completedExercises).length} more exercises`}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Log Exercise Modal - same as before */}
      <Modal visible={logModalVisible} transparent animationType="slide" onRequestClose={() => setLogModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: typeColor }]}>Log Exercise</Text>
              <TouchableOpacity onPress={() => setLogModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {exerciseToLog && (
              <>
                <Text style={styles.modalExerciseName}>{exerciseToLog.name}</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Sets</Text>
                    <TextInput style={styles.input} placeholder="3" placeholderTextColor="#666" keyboardType="numeric" value={logInput.sets} onChangeText={text => setLogInput({ ...logInput, sets: text })} />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput style={styles.input} placeholder="12" placeholderTextColor="#666" keyboardType="numeric" value={logInput.reps} onChangeText={text => setLogInput({ ...logInput, reps: text })} />
                  </View>
                </View>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput style={styles.input} placeholder="60" placeholderTextColor="#666" keyboardType="numeric" value={logInput.weight} onChangeText={text => setLogInput({ ...logInput, weight: text })} />
                <Text style={styles.inputLabel}>Notes (optional)</Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="How did it feel?" placeholderTextColor="#666" value={logInput.notes} onChangeText={text => setLogInput({ ...logInput, notes: text })} multiline numberOfLines={3} />
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: typeColor }, (!logInput.sets || !logInput.reps) && styles.modalButtonDisabled]} onPress={handleLogExercise} disabled={!logInput.sets || !logInput.reps}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles remain the same as before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#00ff41', fontSize: 18, fontWeight: '700' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  backButton: { color: '#00ff41', fontSize: 28, fontWeight: '300' },
  headerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardHeader: { margin: 20, padding: 24, borderRadius: 20, backgroundColor: '#141414', borderWidth: 2, shadowOpacity: 0.4, shadowRadius: 16, alignItems: 'center' },
  typeIcon: { fontSize: 48, marginBottom: 12 },
  workoutName: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  workoutType: { fontSize: 16, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  description: { color: '#999', fontSize: 15, textAlign: 'center', marginTop: 4 },
  progressWrapper: { marginHorizontal: 20, marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressPercent: { fontSize: 16, fontWeight: '800' },
  progressBackground: { height: 12, backgroundColor: '#1a1a1a', borderRadius: 8, overflow: 'hidden' },
  progressBar: { height: 12, borderRadius: 8 },
  progressSubtext: { color: '#666', fontSize: 13, marginTop: 6 },
  exercisesSection: { marginHorizontal: 20 },
  sectionTitle: { color: '#00ff41', fontSize: 13, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  exerciseCard: { backgroundColor: '#141414', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  exerciseHeader: { marginBottom: 12 },
  exerciseNumberContainer: { flexDirection: 'row', alignItems: 'center' },
  exerciseNumber: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  exerciseNumberText: { color: '#000', fontSize: 16, fontWeight: '800' },
  exerciseTitleContainer: { flex: 1 },
  exerciseName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  completedBadge: { fontSize: 13, fontWeight: '700' },
  targetContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  targetChip: { backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  targetLabel: { color: '#666', fontSize: 13, fontWeight: '600' },
  targetValue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  notesContainer: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 12 },
  notesLabel: { color: '#999', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  notesText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  loggedContainer: { padding: 12, borderRadius: 8, marginBottom: 12 },
  loggedTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  loggedDetails: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  loggedText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loggedNotes: { color: '#ccc', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  logButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  logButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
  completeButton: { marginHorizontal: 20, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  completeButtonText: { color: '#000', fontSize: 17, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalClose: { color: '#666', fontSize: 32, fontWeight: '300' },
  modalExerciseName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputHalf: { flex: 1 },
  inputLabel: { color: '#999', fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#0a0a0a', color: '#fff', borderRadius: 10, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#262626', marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButton: { paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  modalButtonDisabled: { backgroundColor: '#404040' },
  modalButtonText: { color: '#000', fontSize: 17, fontWeight: '800' },
});
