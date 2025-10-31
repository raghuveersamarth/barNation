// src/hooks/useExerciseLibrary.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../services/supabase";

export const useExerciseLibrary = (workoutTypeKey) => {
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllExercises, setShowAllExercises] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      setExerciseLibrary(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    let filtered = exerciseLibrary;

    // Filter by workout type if not searching
    if (!showAllExercises && workoutTypeKey) {
      filtered = filtered.filter((ex) => {
        const workoutTypes = ex.workout_types || [];
        return workoutTypes.includes(workoutTypeKey);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name?.toLowerCase().includes(query) ||
          ex.primary_muscles?.toLowerCase().includes(query) ||
          ex.secondary_muscles?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [exerciseLibrary, searchQuery, showAllExercises, workoutTypeKey]);

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    setShowAllExercises(text.trim().length > 0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowAllExercises(false);
  }, []);

  return {
    exerciseLibrary,
    filteredExercises,
    loading,
    searchQuery,
    showAllExercises,
    handleSearch,
    clearSearch,
    refreshExercises: fetchExercises,
  };
};
