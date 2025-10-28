// src/screens/coach/ReviewWorkoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { supabase } from '../../services/supabase';

export default function ReviewWorkoutScreen({ route, navigation }) {
  const { workoutId, clientId } = route.params;

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [client, setClient] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [coachId, setCoachId] = useState(null);
  
  // PR Modal state
  const [showPRModal, setShowPRModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [prType, setPrType] = useState('weight');
  const [prValue, setPrValue] = useState('');
  const [prReps, setPrReps] = useState('');

  const getWorkoutTypeStyle = (type) => {
    const typeMap = {
      push: { color: '#FF8C00', icon: '🏋️', name: 'PUSH' },
      pull: { color: '#1E90FF', icon: '💪', name: 'PULL' },
      legs: { color: '#FFD700', icon: '🦵', name: 'LEGS' },
      other: { color: '#00ff41', icon: '🤸', name: 'OTHER' },
    };
    const normalizedType = (type || 'other').toLowerCase();
    return typeMap[normalizedType] || typeMap.other;
  };

  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCoachId(user?.id);

      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      const { data: clientData, error: clientError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('exercise_submissions')
        .select('*')
        .eq('assigned_workout_id', workoutId)
        .eq('client_id', clientId);

      if (submissionsError) throw submissionsError;

      const submissionsMap = {};
      const feedbackMap = {};
      if (submissionsData) {
        submissionsData.forEach(sub => {
          submissionsMap[sub.exercise_id] = sub;
          feedbackMap[sub.id] = sub.coach_feedback || '';
        });
      }

      setExercises(exercisesData || []);
      setSubmissions(submissionsMap);
      setFeedbackInputs(feedbackMap);
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Error', 'Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedback = (submissionId, feedback) => {
    setFeedbackInputs({
      ...feedbackInputs,
      [submissionId]: feedback,
    });
  };

  const saveFeedback = async (submissionId) => {
    const feedbackText = feedbackInputs[submissionId]?.trim();
    
    if (!feedbackText) {
      Alert.alert('Empty Feedback', 'Please enter some feedback before saving.');
      return;
    }

    if (feedbackText.length < 4) {
      Alert.alert('Feedback Too Short', 'Please enter at least 4 characters.');
      return;
    }

    try {
      const { error } = await supabase
        .from('exercise_submissions')
        .update({
          coach_feedback: feedbackText,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      Alert.alert('Success', 'Feedback saved successfully');
      loadWorkoutData();
    } catch (error) {
      console.error('Error saving feedback:', error);
      Alert.alert('Error', 'Failed to save feedback');
    }
  };

  const completeReview = async (submissionId) => {
    Alert.alert(
      'Complete Review',
      'Are you sure you want to complete this review? You will not be able to edit it anymore.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('exercise_submissions')
                .update({
                  review_locked: true,
                  review_locked_at: new Date().toISOString(),
                  reviewed_at: new Date().toISOString(),
                })
                .eq('id', submissionId);

              if (error) throw error;

              Alert.alert('Success', 'Review completed and locked');
              loadWorkoutData();
            } catch (error) {
              console.error('Error completing review:', error);
              Alert.alert('Error', 'Failed to complete review');
            }
          },
        },
      ]
    );
  };

  const openPRModal = (exercise) => {
    setSelectedExercise(exercise);
    setPrType('weight');
    setPrValue('');
    setPrReps('');
    setShowPRModal(true);
  };

const submitPR = async () => {
  if (!prValue || !selectedExercise) {
    Alert.alert('Missing Info', 'Please enter a PR value');
    return;
  }

  if (prType === 'weight' && !prReps) {
    Alert.alert('Missing Info', 'Please enter the number of reps');
    return;
  }

  try {
    let finalPrValue;
    let prMessage = '';
    
    if (prType === 'weight') {
      // Store as JSONB object
      finalPrValue = {
        weight: parseFloat(prValue),
        reps: parseInt(prReps)
      };
      prMessage = `${prValue}kg for ${prReps} reps`;
    } else if (prType === 'duration') {
      finalPrValue = parseFloat(prValue);
      prMessage = `${prValue} seconds`;
    } else if (prType === 'reps') {
      finalPrValue = parseFloat(prValue);
      prMessage = `${prValue} reps`;
    }

    // Check if the exact same PR already exists for this coach
    const { data: existingPR, error: checkError } = await supabase
      .from('exercise_pr_history')
      .select('pr_value, coach_id')
      .eq('client_id', clientId)
      .eq('exercise_id', selectedExercise.id)
      .eq('pr_type', prType)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      throw checkError;
    }

    // If PR exists and was set by the same coach, check if value is identical
    if (existingPR && existingPR.coach_id === coachId) {
      const existingValue = existingPR.pr_value;
      
      // Compare PR values
      let isSamePR = false;
      if (prType === 'weight') {
        isSamePR = 
          existingValue.weight === finalPrValue.weight && 
          existingValue.reps === finalPrValue.reps;
      } else {
        isSamePR = existingValue === finalPrValue;
      }

      if (isSamePR) {
        Alert.alert(
          'Duplicate PR',
          'This exact PR has already been recorded by you. No changes made.'
        );
        setShowPRModal(false);
        return;
      }
    }

    const prData = {
      client_id: clientId,
      exercise_id: selectedExercise.id,
      pr_type: prType,
      pr_value: finalPrValue,
      pr_date: new Date().toISOString(),
      source: 'coach_review',
      assigned_workout_id: workoutId,
      coach_id: coachId,
    };

    const { error } = await supabase
      .from('exercise_pr_history')
      .upsert(prData, {
        onConflict: 'client_id,exercise_id,pr_type',
      });

    if (error) throw error;

    Alert.alert('Success! 🎉', `New ${prType.toUpperCase()} PR recorded: ${prMessage}`);
    setShowPRModal(false);
    setPrValue('');
    setPrReps('');
  } catch (error) {
    console.error('Error saving PR:', error);
    Alert.alert('Error', 'Failed to record PR: ' + error.message);
  }
};


  const renderPerformanceComparison = (assignedSets, actualSets) => {
    if (!Array.isArray(actualSets) || !Array.isArray(assignedSets)) return null;

    return actualSets.map((actualSet, idx) => {
      const assignedSet = assignedSets[idx] || {};
      
      const assignedReps = parseInt(assignedSet.reps) || 0;
      const actualReps = parseInt(actualSet.reps) || 0;
      const assignedWeight = assignedSet.weight === 'BW' ? 'BW' : (parseFloat(assignedSet.weight) || 0);
      const actualWeight = actualSet.weight === 'BW' ? 'BW' : (parseFloat(actualSet.weight) || 0);

      const repsDiff = assignedWeight !== 'BW' && actualWeight !== 'BW' ? actualReps - assignedReps : 0;
      const weightDiff = assignedWeight !== 'BW' && actualWeight !== 'BW' ? actualWeight - assignedWeight : 0;

      const isUnderperformed = repsDiff < 0 || weightDiff < 0;
      const isOverperformed = repsDiff > 0 || weightDiff > 0;
      const isPerfect = repsDiff === 0 && weightDiff === 0 && assignedWeight !== 'BW';

      const highlightColor = isUnderperformed 
        ? '#FF4444' 
        : isOverperformed 
          ? '#00ff41' 
          : '#FFD700';

      return (
        <View key={idx} style={styles.setComparisonRow}>
          <Text style={styles.setLabel}>Set {idx + 1}</Text>
          <View style={styles.comparisonContent}>
            <View style={styles.assignedColumn}>
              <Text style={styles.assignedLabel}>Assigned</Text>
              <Text style={styles.assignedValue}>
                {assignedSet.weight === 'BW' ? 'BW' : `${assignedSet.weight}kg`} × {assignedSet.reps}
              </Text>
            </View>
            <View style={[styles.actualColumn, { borderLeftColor: highlightColor }]}>
              <Text style={styles.actualLabel}>Performed</Text>
              <Text style={styles.actualValue}>
                {actualSet.weight === 'BW' ? 'BW' : `${actualSet.weight}kg`} × {actualSet.reps}
              </Text>
              {isPerfect && <Text style={styles.perfectBadge}>✓ Perfect</Text>}
              {isOverperformed && <Text style={[styles.perfBadge, { color: '#00ff41' }]}>↑ Exceeded</Text>}
              {isUnderperformed && <Text style={[styles.perfBadge, { color: '#FF4444' }]}>↓ Below</Text>}
            </View>
          </View>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff41" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  const typeStyle = getWorkoutTypeStyle(workout?.type);
  const themeColor = typeStyle.color;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: themeColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: themeColor }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColor }]}>Review Workout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.workoutInfoCard, { borderLeftColor: themeColor }]}>
          <View style={[styles.typeBadge, { backgroundColor: themeColor }]}>
            <Text style={styles.typeIcon}>{typeStyle.icon}</Text>
            <Text style={styles.typeBadgeText}>{typeStyle.name}</Text>
          </View>
          <Text style={styles.clientNameLarge}>{client?.name}</Text>
          <Text style={styles.workoutNameLarge}>{workout?.name}</Text>
          {workout?.description && (
            <Text style={styles.workoutDescription}>{workout.description}</Text>
          )}
          <Text style={styles.workoutDate}>
            {new Date(workout?.date).toLocaleDateString()}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: themeColor }]}>EXERCISES</Text>
        
        {exercises.map((exercise, index) => {
          const submission = submissions[exercise.id];
          const isReviewed = !!submission?.reviewed_at;
          const isLocked = !!submission?.review_locked;

          return (
            <View 
              key={exercise.id} 
              style={[
                styles.exerciseCard,
                isLocked && styles.exerciseCardLocked
              ]}
            >
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseNumber, { backgroundColor: themeColor }]}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                {isLocked ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>🔒 Completed</Text>
                  </View>
                ) : isReviewed && (
                  <View style={styles.reviewedBadge}>
                    <Text style={styles.reviewedBadgeText}>✓</Text>
                  </View>
                )}
              </View>

              {submission ? (
                <>
                  <View style={styles.performanceSection}>
                    {renderPerformanceComparison(exercise.sets, submission.actual_sets)}
                  </View>

                  {!isLocked && (
                    <TouchableOpacity
                      style={[styles.prButton, { backgroundColor: themeColor }]}
                      onPress={() => openPRModal(exercise)}
                    >
                      <Text style={styles.prButtonText}>🏆 Record PR</Text>
                    </TouchableOpacity>
                  )}

                  {submission.notes && (
                    <View style={styles.clientNotesSection}>
                      <Text style={styles.notesLabel}>📝 {submission.notes}</Text>
                    </View>
                  )}

                  {submission.coach_feedback && isLocked && (
                    <View style={styles.lockedFeedbackSection}>
                      <Text style={styles.lockedFeedbackLabel}>Your Feedback (Locked)</Text>
                      <Text style={styles.lockedFeedbackText}>{submission.coach_feedback}</Text>
                    </View>
                  )}

                  {!isLocked && (
                    <>
                      <View style={styles.feedbackSection}>
                        <TextInput
                          style={styles.feedbackInput}
                          placeholder="Add feedback..."
                          placeholderTextColor="#666"
                          multiline
                          numberOfLines={2}
                          value={feedbackInputs[submission.id] || ''}
                          onChangeText={(text) => updateFeedback(submission.id, text)}
                        />
                        <TouchableOpacity
                          style={[styles.saveFeedbackButton, { backgroundColor: themeColor }]}
                          onPress={() => saveFeedback(submission.id)}
                        >
                          <Text style={styles.saveFeedbackButtonText}>
                            {isReviewed ? 'Update' : 'Save'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.completeReviewButton}
                        onPress={() => completeReview(submission.id)}
                      >
                        <Text style={styles.completeReviewButtonText}>
                          ✓ Complete Review & Lock
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <View style={styles.notSubmittedSection}>
                  <Text style={styles.notSubmittedText}>Not submitted</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* PR Recording Modal */}
      <Modal
        visible={showPRModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColor }]}>Record PR</Text>
              <TouchableOpacity onPress={() => setShowPRModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.exerciseNameModal}>{selectedExercise?.name}</Text>
              <Text style={styles.clientNameModal}>{client?.name}</Text>

              <Text style={[styles.inputLabel, { color: themeColor }]}>PR Type</Text>
              <View style={styles.prTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.prTypeButton,
                    prType === 'weight' && { backgroundColor: themeColor, borderColor: themeColor },
                  ]}
                  onPress={() => setPrType('weight')}
                >
                  <Text style={[styles.prTypeButtonText, prType === 'weight' && { color: '#000' }]}>
                    Weight
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.prTypeButton,
                    prType === 'reps' && { backgroundColor: themeColor, borderColor: themeColor },
                  ]}
                  onPress={() => setPrType('reps')}
                >
                  <Text style={[styles.prTypeButtonText, prType === 'reps' && { color: '#000' }]}>
                    Reps
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.prTypeButton,
                    prType === 'duration' && { backgroundColor: themeColor, borderColor: themeColor },
                  ]}
                  onPress={() => setPrType('duration')}
                >
                  <Text style={[styles.prTypeButtonText, prType === 'duration' && { color: '#000' }]}>
                    Duration
                  </Text>
                </TouchableOpacity>
              </View>

              {prType === 'weight' && (
                <>
                  <Text style={[styles.inputLabel, { color: themeColor }]}>Weight (kg)</Text>
                  <TextInput
                    style={styles.prInput}
                    placeholder="Enter weight"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={prValue}
                    onChangeText={(text) => setPrValue(text.replace(/[^0-9.]/g, ''))}
                  />

                  <Text style={[styles.inputLabel, { color: themeColor }]}>Reps</Text>
                  <TextInput
                    style={styles.prInput}
                    placeholder="Enter reps"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={prReps}
                    onChangeText={(text) => setPrReps(text.replace(/[^0-9]/g, ''))}
                  />
                </>
              )}

              {prType === 'duration' && (
                <>
                  <Text style={[styles.inputLabel, { color: themeColor }]}>Duration (seconds)</Text>
                  <TextInput
                    style={styles.prInput}
                    placeholder="Enter duration"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={prValue}
                    onChangeText={(text) => setPrValue(text.replace(/[^0-9.]/g, ''))}
                  />
                </>
              )}

              {prType === 'reps' && (
                <>
                  <Text style={[styles.inputLabel, { color: themeColor }]}>Max Reps</Text>
                  <TextInput
                    style={styles.prInput}
                    placeholder="Enter max reps"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={prValue}
                    onChangeText={(text) => setPrValue(text.replace(/[^0-9]/g, ''))}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.submitPRButton, { backgroundColor: themeColor }]}
                onPress={submitPR}
              >
                <Text style={styles.submitPRButtonText}>🏆 Record PR</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: { color: '#00ff41', fontSize: 16, marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  workoutInfoCard: {
    backgroundColor: '#141414',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
    gap: 4,
  },
  typeIcon: { fontSize: 14 },
  typeBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  clientNameLarge: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  workoutNameLarge: {
    color: '#00ff41',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutDescription: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  workoutDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#141414',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
  },
  exerciseCardLocked: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  exerciseNumberText: { color: '#000', fontSize: 14, fontWeight: '800' },
  exerciseName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewedBadge: {
    backgroundColor: '#00ff41',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewedBadgeText: { color: '#000', fontSize: 14, fontWeight: '800' },
  completedBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  completedBadgeText: { 
    color: '#000', 
    fontSize: 11, 
    fontWeight: '800',
  },
  performanceSection: { marginBottom: 12 },
  setComparisonRow: { marginBottom: 8 },
  setLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  comparisonContent: {
    flexDirection: 'row',
    gap: 8,
  },
  assignedColumn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 6,
  },
  assignedLabel: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  assignedValue: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  actualColumn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  actualLabel: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  actualValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  perfectBadge: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  perfBadge: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  prButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  prButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  clientNotesSection: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#00ff41',
  },
  notesLabel: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 17,
  },
  lockedFeedbackSection: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lockedFeedbackLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  lockedFeedbackText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackSection: { 
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feedbackInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveFeedbackButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 60,
  },
  saveFeedbackButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  completeReviewButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeReviewButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  notSubmittedSection: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  notSubmittedText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalClose: {
    color: '#999',
    fontSize: 26,
  },
  exerciseNameModal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  clientNameModal: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  prTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  prTypeButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  prTypeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  prInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 6,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  submitPRButton: {
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitPRButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
});
