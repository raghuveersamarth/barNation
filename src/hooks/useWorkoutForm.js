// src/hooks/useWorkoutForm.js
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { supabase } from "../services/supabase";

export const useWorkoutForm = (coachId, navigation) => {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  const addExercise = useCallback((exercise) => {
    setExercises((prev) => [...prev, { ...exercise, order: prev.length }]);
  }, []);

  const removeExercise = useCallback((index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveExerciseUp = useCallback((index) => {
    if (index === 0) return;
    setExercises((prev) => {
      const newExercises = [...prev];
      [newExercises[index - 1], newExercises[index]] = [
        newExercises[index],
        newExercises[index - 1],
      ];
      return newExercises;
    });
  }, []);

  const moveExerciseDown = useCallback((index) => {
    setExercises((prev) => {
      if (index === prev.length - 1) return prev;
      const newExercises = [...prev];
      [newExercises[index], newExercises[index + 1]] = [
        newExercises[index + 1],
        newExercises[index],
      ];
      return newExercises;
    });
  }, []);

  const toggleClient = useCallback((client) => {
    setSelectedClients((prev) => {
      const exists = prev.find((c) => c.id === client.id);
      if (exists) {
        return prev.filter((c) => c.id !== client.id);
      }
      return [...prev, client];
    });
  }, []);

  const saveWorkout = useCallback(async () => {
    // Validation
    if (!workoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return false;
    }

    if (exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
      return false;
    }

    if (!saveAsTemplate && selectedClients.length === 0) {
      Alert.alert("Error", "Please select at least one client or save as template");
      return false;
    }

    setSaving(true);

    try {
      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          coach_id: coachId,
          name: workoutName,
          description: workoutDescription || null,
          is_template: saveAsTemplate,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert exercises
      const workoutExercises = exercises.map((exercise, index) => ({
        workout_id: workout.id,
        exercise_id: exercise.id,
        order: index,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
        is_superset: exercise.is_superset || false,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(workoutExercises);

      if (exercisesError) throw exercisesError;

      // Assign to clients if not template
      if (!saveAsTemplate && selectedClients.length > 0) {
        const assignments = selectedClients.map((client) => ({
          workout_id: workout.id,
          client_id: client.id,
          assigned_by: coachId,
          status: "active",
        }));

        const { error: assignError } = await supabase
          .from("workout_assignments")
          .insert(assignments);

        if (assignError) throw assignError;
      }

      Alert.alert(
        "Success",
        saveAsTemplate
          ? "Workout template created successfully"
          : `Workout assigned to ${selectedClients.length} client(s)`
      );

      navigation.goBack();
      return true;
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to create workout: " + error.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    workoutName,
    workoutDescription,
    exercises,
    selectedClients,
    saveAsTemplate,
    coachId,
    navigation,
  ]);

  return {
    workoutName,
    setWorkoutName,
    workoutDescription,
    setWorkoutDescription,
    exercises,
    selectedClients,
    saveAsTemplate,
    setSaveAsTemplate,
    saving,
    addExercise,
    removeExercise,
    moveExerciseUp,
    moveExerciseDown,
    toggleClient,
    saveWorkout,
  };
};
