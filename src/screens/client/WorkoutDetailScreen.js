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
  const [progress, setProgress] = useState(0);
  const [completedExercises, setCompletedExercises] = useState({});

  // Color scheme based on workout type string
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

  const loadWorkoutExercises = async () => {
    setLoading(true);
    try {
      let { data: exercises } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", assignedWorkout.id)
        .order("order_index", { ascending: true });
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

  // Show each set's reps and weight details
  const renderSetsDetails = (sets) => {
    if (!Array.isArray(sets)) return null;
    return sets.map((set, idx) => (
      <Text key={idx} style={styles.setDetailText}>
        Set {idx + 1}: {set.weight ? set.weight + "kgs" : "bw"}{" "}
        {`x ${set.reps}`} reps
      </Text>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.cardHeader,
          { borderColor: typeColor, shadowColor: typeColor },
        ]}
      >
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
        <Text style={styles.sectionTitle}>EXERCISES</Text>
        <FlatList
          data={cardExercises}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <View style={[styles.exerciseCard]}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseNumberContainer}>
                  <View
                    style={[
                      styles.exerciseNumber,
                      { backgroundColor: typeColor },
                    ]}
                  >
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseTitleContainer}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                  </View>
                </View>
              </View>

              {/* New Target: Each set's reps and weight listed */}
              <View style={styles.setsDetailsContainer}>
                {renderSetsDetails(item.sets)}
              </View>

              {/* Rest time remains unchanged */}
              {item.rest_seconds ? (
                <Text style={styles.restText}>
                  ⏱️ Rest: {item.rest_seconds}s
                </Text>
              ) : null}

              {/* Coach notes */}
              {item.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>💬 Coach Notes:</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              )}
            </View>
          )}
        />
      </View>

      {/* Begin Workout Button */}
      <TouchableOpacity
        style={[styles.beginWorkoutButton, { backgroundColor: typeColor }]}
        onPress={() =>
          navigation.navigate("LogExerciseScreen", {
            workoutId: assignedWorkout.id,
          })
        }
      >
        <Text style={styles.beginWorkoutButtonText}>Begin the Workout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Keep your existing styles here; updated style keys used above
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
  marginTop: 60,  // Increase this from 20 to 60 or as desired
  marginBottom: 60,  // Increase this from 20 to 60 or as desired
  padding: 24,
  borderRadius: 20,
  backgroundColor: '#141414',
  borderWidth: 2,
  shadowOpacity: 0.4,
  shadowRadius: 16,
  alignItems: 'center',
  borderColor: '#00ff41',
  shadowColor: '#00ff41',
},

  typeIcon: { fontSize: 48, marginBottom: 12 },
workoutName: { 
  color: '#fff', 
  fontSize: 24, 
  fontWeight: '800', 
  textAlign: 'center', 
  marginBottom: 8,
  marginTop: 30, // if you prefer inline marginTop, omit this
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
  setsDetailsContainer: { marginBottom: 12 },
  setDetailText: {
    color: "#d4d4d4",
    fontSize: 14,
    marginVertical: 2,
    marginLeft: 8,
  },
  restText: { color: "#a3a3a3", fontSize: 13, marginTop: 8, marginLeft: 8 },
  notesContainer: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginLeft: 8,
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
});
