import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function LogExerciseScreen({ route, navigation }) {
  const { workoutId } = route.params;

  const [loading, setLoading] = useState(true);
  const [workoutType, setWorkoutType] = useState('other');
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

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

  const typeStyle = getWorkoutTypeStyle(workoutType);
  const themeColor = typeStyle.color;

  useEffect(() => {
    fetchWorkoutAndExercises();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleQuit);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!loading && exercises.length > 0) {
      saveProgressToDatabase();
    }
  }, [submissions]);

  async function fetchWorkoutAndExercises() {
    setLoading(true);
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('type, status')
        .eq('id', workoutId)
        .single();

      if (workoutError) throw workoutError;
      setWorkoutType(workoutData.type || 'other');

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: existingSubmissions } = await supabase
        .from('exercise_submissions')
        .select('*')
        .eq('assigned_workout_id', workoutId)
        .eq('client_id', user?.id);

      const initialSubmissions = {};
      let resumeIndex = 0;
      let foundIncomplete = false;

      exercisesData.forEach((exercise, idx) => {
        const existingSubmission = existingSubmissions?.find(sub => sub.exercise_id === exercise.id);
        const totalSetsRequired = exercise.sets.length;
        
        if (existingSubmission) {
          const savedSets = existingSubmission.actual_sets || [];
          const completedSetsCount = savedSets.filter(set => set.reps && set.weight).length;
          
          // Check if this exercise is fully complete
          const isFullyComplete = completedSetsCount === totalSetsRequired;
          
          if (!isFullyComplete && !foundIncomplete) {
            // This is the first incomplete exercise - restore saved sets and add empty ones
            const restoredSets = exercise.sets.map((assignedSet, setIdx) => {
              if (savedSets[setIdx]) {
                // Restore saved set data
                return {
                  reps: savedSets[setIdx].reps || '',
                  weight: savedSets[setIdx].weight || '',
                  checked: !!(savedSets[setIdx].reps && savedSets[setIdx].weight),
                };
              } else {
                // Empty set for remaining sets
                return { reps: '', weight: '', checked: false };
              }
            });
            
            initialSubmissions[exercise.id] = {
              sets: restoredSets,
              videoUri: existingSubmission.video_url,
              notes: existingSubmission.notes || '',
              submissionId: existingSubmission.id,
            };
            
            resumeIndex = idx; // Stay on this exercise
            foundIncomplete = true;
          } else if (isFullyComplete) {
            // This exercise is complete
            initialSubmissions[exercise.id] = {
              sets: savedSets.map(set => ({
                reps: set.reps || '',
                weight: set.weight || '',
                checked: true,
              })),
              videoUri: existingSubmission.video_url,
              notes: existingSubmission.notes || '',
              submissionId: existingSubmission.id,
            };
            
            // Only move resume index if we haven't found an incomplete exercise yet
            if (!foundIncomplete) {
              resumeIndex = idx + 1;
            }
          }
        } else {
          // No submission exists - empty exercise
          initialSubmissions[exercise.id] = {
            sets: exercise.sets.map(() => ({ reps: '', weight: '', checked: false })),
            videoUri: null,
            notes: '',
          };
          
          if (!foundIncomplete) {
            resumeIndex = idx;
            foundIncomplete = true;
          }
        }
      });

      setExercises(exercisesData);
      setSubmissions(initialSubmissions);
      
      const targetIndex = resumeIndex < exercisesData.length ? resumeIndex : exercisesData.length - 1;
      setCurrentIndex(targetIndex);

      setTimeout(() => {
        if (flatListRef.current && targetIndex > 0) {
          flatListRef.current.scrollToIndex({ index: targetIndex, animated: false });
        }
      }, 100);

      if (workoutData.status !== 'completed') {
        await supabase
          .from('workouts')
          .update({ status: 'in_progress' })
          .eq('id', workoutId);
      }

    } catch (err) {
      console.error('Error loading workout:', err);
      Alert.alert('Error', 'Failed to load workout details');
    } finally {
      setLoading(false);
    }
  }

  const saveProgressToDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const exercise of exercises) {
        const submission = submissions[exercise.id];
        if (!submission) continue;

        const hasCompletedSets = submission.sets.some(set => set.checked);
        if (!hasCompletedSets) continue;

        let videoUrl = submission.videoUri;

        if (submission.videoUri && submission.videoUri.startsWith('file://')) {
          const fileName = `workouts/${workoutId}/${exercise.id}/${Date.now()}.mp4`;
          const response = await fetch(submission.videoUri);
          const blob = await response.blob();
          const { error: uploadError } = await supabase.storage
            .from('exercise-videos')
            .upload(fileName, blob, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('exercise-videos').getPublicUrl(fileName);
            videoUrl = urlData.publicUrl;
          }
        }

        const submissionData = {
          assigned_workout_id: workoutId,
          exercise_id: exercise.id,
          client_id: user?.id,
          video_url: videoUrl,
          notes: submission.notes,
          actual_sets: submission.sets.map(set => ({ reps: set.reps, weight: set.weight })),
        };

        if (submission.submissionId) {
          await supabase
            .from('exercise_submissions')
            .update(submissionData)
            .eq('id', submission.submissionId);
        } else {
          const { data } = await supabase
            .from('exercise_submissions')
            .insert(submissionData)
            .select()
            .single();
          
          if (data) {
            setSubmissions(prev => ({
              ...prev,
              [exercise.id]: { ...prev[exercise.id], submissionId: data.id }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleQuit = () => {
    Alert.alert(
      'Quit Workout?',
      'Your progress has been saved. You can continue later from where you left off.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
    return true;
  };

  const isCurrentExerciseComplete = () => {
    const currentExercise = exercises[currentIndex];
    const submission = submissions[currentExercise?.id];
    if (!submission) return false;
    return submission.sets.every((set) => set.checked === true);
  };

  const goToNext = () => {
    if (!isCurrentExerciseComplete()) {
      Alert.alert('Incomplete Exercise', 'Please complete and check all sets before moving to the next exercise.');
      return;
    }

    if (currentIndex < exercises.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex });
    } else {
      confirmCompleteWorkout();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex });
    }
  };

  const confirmCompleteWorkout = () => {
    if (!isCurrentExerciseComplete()) {
      Alert.alert('Incomplete Exercise', 'Please complete all sets before finishing the workout.');
      return;
    }

    Alert.alert(
      'Complete Workout',
      'Mark this workout as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', style: 'destructive', onPress: submitAllSubmissions },
      ]
    );
  };

  const submitAllSubmissions = async () => {
    try {
      await supabase
        .from('workouts')
        .update({ status: 'completed' })
        .eq('id', workoutId);

      Alert.alert('Workout Completed! 🎉', 'Great job! Your results have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to complete workout: ' + error.message);
    }
  };

  const pickVideo = async (exerciseId) => {
    let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to upload videos.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.6,
    });
    if (!result.canceled) {
      setSubmissions({
        ...submissions,
        [exerciseId]: { ...submissions[exerciseId], videoUri: result.assets[0].uri },
      });
    }
  };

  const updateSetValue = (exerciseId, setIndex, field, value) => {
    const updatedSets = [...submissions[exerciseId].sets];
    updatedSets[setIndex][field] = value;
    updatedSets[setIndex].checked = false;
    setSubmissions({
      ...submissions,
      [exerciseId]: { ...submissions[exerciseId], sets: updatedSets },
    });
  };

  const handleCheckboxToggle = (exerciseId, setIndex, assignedSet) => {
    const updatedSets = [...submissions[exerciseId].sets];
    const currentSet = updatedSets[setIndex];
    
    if (currentSet.checked) {
      updatedSets[setIndex] = { ...currentSet, checked: false };
    } else {
      if (!currentSet.reps && !currentSet.weight) {
        updatedSets[setIndex] = {
          reps: assignedSet.reps?.toString() || '',
          weight: assignedSet.weight?.toString() || '',
          checked: true,
        };
      } else {
        updatedSets[setIndex] = { ...currentSet, checked: true };
      }
    }
    
    setSubmissions({
      ...submissions,
      [exerciseId]: { ...submissions[exerciseId], sets: updatedSets },
    });
  };

  const updateNotes = (exerciseId, notes) => {
    setSubmissions({
      ...submissions,
      [exerciseId]: { ...submissions[exerciseId], notes },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: themeColor }]}>Loading...</Text>
      </View>
    );
  }

  const renderExercise = ({ item, index }) => {
    const submission = submissions[item.id] || { sets: [], videoUri: null, notes: '' };
    const isComplete = index === currentIndex ? isCurrentExerciseComplete() : submission.sets.every(s => s.checked);

    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.exerciseContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
            <Text style={styles.quitButtonText}>✕ Quit</Text>
          </TouchableOpacity>

          <View style={styles.videoContainer}>
            {item.video_url ? (
              <Video
                source={{ uri: item.video_url }}
                style={styles.video}
                resizeMode="contain"
                useNativeControls
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>No Demo Video</Text>
              </View>
            )}
          </View>

          <Text style={[styles.exerciseName, { color: themeColor }]}>{item.name}</Text>

          {item.rest_seconds ? (
            <Text style={styles.restText}>⏱️ Rest: {item.rest_seconds}s between sets</Text>
          ) : null}

          {item.notes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>💬 Coach Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: themeColor }]}>Log Your Sets</Text>
          {submission.sets.map((set, setIndex) => {
            const assignedSet = item.sets[setIndex] || {};
            const isChecked = set.checked;
            
            return (
              <View key={setIndex} style={styles.setInputRow}>
                <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                <TextInput
                  style={styles.setInput}
                  placeholder={assignedSet.reps?.toString() || '0'}
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(text) => updateSetValue(item.id, setIndex, 'reps', text)}
                />
                <TextInput
                  style={styles.setInput}
                  placeholder={assignedSet.weight?.toString() || 'BW'}
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(text) => updateSetValue(item.id, setIndex, 'weight', text)}
                />
                <TouchableOpacity
                  style={[
                    styles.checkbox, 
                    { borderColor: themeColor },
                    isChecked && { backgroundColor: themeColor }
                  ]}
                  onPress={() => handleCheckboxToggle(item.id, setIndex, assignedSet)}
                >
                  {isChecked && <Text style={styles.checkboxText}>✓</Text>}
                </TouchableOpacity>
              </View>
            );
          })}

          <Text style={[styles.sectionLabel, { color: themeColor, marginTop: 20 }]}>Upload Form Check Video (Optional)</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: themeColor }]}
            onPress={() => pickVideo(item.id)}
          >
            <Text style={[styles.uploadButtonText, { color: themeColor }]}>
              {submission.videoUri ? '✓ Video Selected' : '📹 Choose Video'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { color: themeColor }]}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did it feel?"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            value={submission.notes}
            onChangeText={(text) => updateNotes(item.id, text)}
          />

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, index === 0 && styles.navButtonDisabled]}
              onPress={goToPrevious}
              disabled={index === 0}
            >
              <Text style={styles.navButtonText}>← Back</Text>
            </TouchableOpacity>

            {index < exercises.length - 1 ? (
              <TouchableOpacity
                style={[
                  styles.navButton, 
                  { backgroundColor: isComplete ? themeColor : '#404040' }
                ]}
                onPress={goToNext}
              >
                <Text style={styles.navButtonText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.completeButton, 
                  { backgroundColor: isComplete ? themeColor : '#404040' }
                ]}
                onPress={confirmCompleteWorkout}
              >
                <Text style={styles.completeButtonText}>Complete ✓</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ref={flatListRef}
        data={exercises}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 100));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { fontSize: 18, fontWeight: '700' },
  exerciseContainer: { width: SCREEN_WIDTH, backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  quitButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 10,
  },
  quitButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  videoContainer: { height: 200, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 20, marginTop: 10 },
  video: { flex: 1 },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoPlaceholderText: { color: '#666', fontSize: 14 },
  exerciseName: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  restText: { color: '#999', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  notesContainer: { backgroundColor: '#141414', padding: 10, borderRadius: 8, marginBottom: 16 },
  notesLabel: { color: '#999', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  notesText: { color: '#ccc', fontSize: 13, lineHeight: 18 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5, marginTop: 8 },
  setInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  setLabel: { color: '#fff', fontSize: 14, fontWeight: '600', width: 50 },
  setInput: { flex: 1, backgroundColor: '#141414', color: '#fff', borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, borderColor: '#262626' },
  checkbox: { width: 36, height: 36, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxText: { color: '#000', fontSize: 18, fontWeight: '800' },
  uploadButton: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  uploadButtonText: { fontSize: 14, fontWeight: '700' },
  notesInput: { backgroundColor: '#141414', color: '#fff', borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#262626', height: 80, textAlignVertical: 'top', marginBottom: 20 },
  navigationButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
  navButton: { flex: 1, backgroundColor: '#00ff41', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  navButtonDisabled: { backgroundColor: '#404040' },
  navButtonText: { color: '#000', fontWeight: '800', fontSize: 15 },
  completeButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  completeButtonText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
