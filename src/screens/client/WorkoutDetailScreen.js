import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function WorkoutDetailScreen({ route, navigation }) {
  const assignedWorkout = route.params?.assignedWorkout;

  const [loading, setLoading] = useState(true);
  const [cardExercises, setCardExercises] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [workoutStatus, setWorkoutStatus] = useState('not_started');

  const getWorkoutTypeStyle = (type) => {
    const typeMap = {
      push: { color: "#FF8C00", icon: "🏋️", name: "PUSH" },
      pull: { color: "#1E90FF", icon: "💪", name: "PULL" },
      legs: { color: "#FFD700", icon: "🦵", name: "LEGS" },
      other: { color: "#00ff41", icon: "🤸", name: "OTHER" },
    };
    const normalizedType = (type || "other").toLowerCase();
    return typeMap[normalizedType] || typeMap.other;
  };

  useEffect(() => {
    loadWorkoutExercises();
  }, []);

  // Refresh when returning from LogExercise screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadWorkoutExercises();
    });
    return unsubscribe;
  }, [navigation]);

  const loadWorkoutExercises = async () => {
    setLoading(true);
    try {
      // Load exercises
      let { data: exercises } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", assignedWorkout.id)
        .order("order_index", { ascending: true });

      // Get workout status from database
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("status")
        .eq("id", assignedWorkout.id)
        .single();

      if (workoutError) throw workoutError;

      const currentStatus = workoutData?.status || 'not_started';
      setWorkoutStatus(currentStatus);
      setIsCompleted(currentStatus === 'completed');

      // Check if workout is completed by loading submissions
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: submissionsData, error: subError } = await supabase
        .from("exercise_submissions")
        .select("*")
        .eq("assigned_workout_id", assignedWorkout.id)
        .eq("client_id", user?.id);

      if (subError) throw subError;

      // Map submissions by exercise_id
      const submissionsMap = {};
      if (submissionsData && submissionsData.length > 0) {
        submissionsData.forEach(sub => {
          submissionsMap[sub.exercise_id] = sub;
        });
      }

      setSubmissions(submissionsMap);
      setCardExercises(exercises || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading workout:", err);
      setLoading(false);
    }
  };

  const typeStyle = getWorkoutTypeStyle(assignedWorkout.type);
  const typeColor = typeStyle.color;
  const typeIcon = typeStyle.icon;
  const typeName = typeStyle.name;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  // Render assigned sets (before completion)
  const renderSetsDetails = (sets) => {
    if (!Array.isArray(sets)) return null;
    return sets.map((set, idx) => (
      <Text key={idx} style={styles.setDetailText}>
        Set {idx + 1}: {set.weight ? set.weight + "kg" : "bw"} x {set.reps} reps
      </Text>
    ));
  };

  // Render actual sets with performance comparison
  const renderActualSets = (assignedSets, actualSets) => {
    if (!Array.isArray(actualSets) || !Array.isArray(assignedSets)) return null;

    return actualSets.map((actualSet, idx) => {
      const assignedSet = assignedSets[idx] || {};
      
      const assignedReps = parseInt(assignedSet.reps) || 0;
      const actualReps = parseInt(actualSet.reps) || 0;
      const assignedWeight = parseFloat(assignedSet.weight) || 0;
      const actualWeight = parseFloat(actualSet.weight) || 0;

      const repsDiff = actualReps - assignedReps;
      const weightDiff = actualWeight - assignedWeight;

      // Determine highlight color based on performance
      const isUnderperformed = repsDiff < 0 || weightDiff < 0;
      const isOverperformed = repsDiff > 0 || weightDiff > 0;
      const isPerfect = repsDiff === 0 && weightDiff === 0;

      const highlightColor = isUnderperformed 
        ? '#FF4444' 
        : isOverperformed 
          ? '#00ff41' 
          : '#FFD700';

      return (
        <View key={idx} style={[styles.actualSetRow, { borderLeftColor: highlightColor }]}>
          <Text style={styles.actualSetText}>
            Set {idx + 1}: {actualSet.weight || 'bw'}kg x {actualSet.reps} reps
          </Text>
          {repsDiff !== 0 && (
            <Text style={[styles.diffBadge, { color: highlightColor }]}>
              {repsDiff > 0 ? '+' : ''}{repsDiff} reps
            </Text>
          )}
          {weightDiff !== 0 && (
            <Text style={[styles.diffBadge, { color: highlightColor }]}>
              {weightDiff > 0 ? '+' : ''}{weightDiff}kg
            </Text>
          )}
          {isPerfect && (
            <Text style={[styles.perfectBadge]}>✓ Perfect</Text>
          )}
        </View>
      );
    });
  };

  // Get button text based on status
  const getButtonText = () => {
    if (isCompleted) return null;
    if (workoutStatus === 'in_progress') return 'Continue Workout';
    return 'Begin Workout';
  };

  const buttonText = getButtonText();

  return (
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.cardHeader,
          { borderColor: typeColor, shadowColor: typeColor },
        ]}
      >
        {isCompleted && (
          <View style={[styles.completedBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.completedBadgeText}>✓ COMPLETED</Text>
          </View>
        )}
        {workoutStatus === 'in_progress' && !isCompleted && (
          <View style={[styles.inProgressBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.inProgressBadgeText}>⏸ IN PROGRESS</Text>
          </View>
        )}
        <Text style={styles.typeIcon}>{typeIcon}</Text>
        <Text style={[styles.workoutName, { marginTop: 24 }]}>
          {assignedWorkout.name}
        </Text>
        <Text style={[styles.workoutType, { color: typeColor }]}>
          {typeName}
        </Text>
        {assignedWorkout.description ? (
          <Text style={styles.description}>{assignedWorkout.description}</Text>
        ) : null}
      </View>

      <View style={styles.exercisesSection}>
        <Text style={styles.sectionTitle}>
          {isCompleted ? 'WORKOUT RESULTS' : 'EXERCISES'}
        </Text>
        <FlatList
          data={cardExercises}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item, index }) => {
            const submission = submissions[item.id];
            const hasSubmission = !!submission;
            
            return (
              <View style={[styles.exerciseCard]}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNumberContainer}>
                    <View
                      style={[
                        styles.exerciseNumber,
                        { backgroundColor: hasSubmission && !isCompleted ? '#FFD700' : typeColor },
                      ]}
                    >
                      <Text style={styles.exerciseNumberText}>
                        {hasSubmission && !isCompleted ? '✓' : index + 1}
                      </Text>
                    </View>
                    <View style={styles.exerciseTitleContainer}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      {hasSubmission && !isCompleted && (
                        <Text style={styles.savedBadge}>✓ Saved Progress</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Show assigned sets if not completed */}
                {!isCompleted && (
                  <>
                    <Text style={styles.subsectionLabel}>Assigned Sets:</Text>
                    <View style={styles.setsDetailsContainer}>
                      {renderSetsDetails(item.sets)}
                    </View>
                  </>
                )}

                {/* Show saved progress if has submission but not completed */}
                {!isCompleted && hasSubmission && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>Your Progress (Continue to edit):</Text>
                    <View style={styles.savedSetsContainer}>
                      {submission.actual_sets.map((set, idx) => (
                        <Text key={idx} style={styles.savedSetText}>
                          Set {idx + 1}: {set.weight || 'bw'}kg x {set.reps} reps ✓
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* Show actual performance if completed */}
                {isCompleted && submission && (
                  <>
                    <Text style={styles.subsectionLabel}>Your Performance:</Text>
                    <View style={styles.actualSetsContainer}>
                      {renderActualSets(item.sets, submission.actual_sets)}
                    </View>
                    
                    {submission.notes && (
                      <View style={styles.clientNotesContainer}>
                        <Text style={styles.notesLabel}>📝 Your Notes:</Text>
                        <Text style={styles.notesText}>{submission.notes}</Text>
                      </View>
                    )}
                  </>
                )}

                {/* Rest time */}
                {item.rest_seconds && !isCompleted && (
                  <Text style={styles.restText}>
                    ⏱️ Rest: {item.rest_seconds}s
                  </Text>
                )}

                {/* Coach notes */}
                {item.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>💬 Coach Notes:</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>

      {/* Buttons */}
      {buttonText ? (
        <TouchableOpacity
          style={[styles.beginWorkoutButton, { backgroundColor: typeColor }]}
          onPress={() =>
            navigation.navigate("LogExerciseScreen", {
              workoutId: assignedWorkout.id,
            })
          }
        >
          <Text style={styles.beginWorkoutButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.goBackButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>← Go Back</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: { color: "#00ff41", fontSize: 18, fontWeight: "700" },
  cardHeader: {
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    alignItems: "center",
    position: 'relative',
  },
  completedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  inProgressBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inProgressBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  typeIcon: { fontSize: 48, marginBottom: 12 },
  workoutName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 30,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  description: {
    color: "#999",
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
  },
  exercisesSection: { marginHorizontal: 20 },
  sectionTitle: {
    color: "#00ff41",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 16,
  },
  subsectionLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
  },
  exerciseCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  exerciseHeader: { marginBottom: 12 },
  exerciseNumberContainer: { flexDirection: "row", alignItems: "center" },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseNumberText: { color: "#000", fontSize: 16, fontWeight: "800" },
  exerciseTitleContainer: { flex: 1 },
  exerciseName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  savedBadge: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  setsDetailsContainer: { marginBottom: 12 },
  setDetailText: {
    color: "#d4d4d4",
    fontSize: 14,
    marginVertical: 2,
    marginLeft: 8,
  },
  progressContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  progressLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  savedSetsContainer: {
    marginLeft: 8,
  },
  savedSetText: {
    color: '#ccc',
    fontSize: 13,
    marginVertical: 2,
  },
  actualSetsContainer: { marginBottom: 12 },
  actualSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    marginVertical: 2,
    borderLeftWidth: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    gap: 8,
  },
  actualSetText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  diffBadge: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  perfectBadge: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  restText: { color: "#a3a3a3", fontSize: 13, marginTop: 8, marginLeft: 8 },
  notesContainer: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginLeft: 8,
  },
  clientNotesContainer: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff41',
  },
  notesLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  notesText: { color: "#ccc", fontSize: 14, lineHeight: 20 },
  beginWorkoutButton: {
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  beginWorkoutButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  goBackButton: {
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  goBackButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
