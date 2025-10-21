import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ChooseWorkoutTypeScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState(null);

  const workoutTypes = ["Push", "Pull", "Legs", "Other"];

  const handleNext = () => {
    if (!selectedType) return; // safety check
    navigation.navigate("CreateWorkout", {
      workoutType: selectedType.toLowerCase(),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Workout Type</Text>
      <View style={styles.typeContainer}>
        {workoutTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              selectedType === type && styles.typeButtonSelected
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.typeText,
                selectedType === type && styles.typeTextSelected
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, !selectedType && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!selectedType} // disables button if no type selected
      >
        <Text style={styles.nextButtonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#00ff41",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: "#262626",
    borderRadius: 10,
    backgroundColor: "#141414",
    alignItems: "center",
  },
  typeButtonSelected: {
    backgroundColor: "#00ff41",
    borderColor: "#00ff41",
  },
  typeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  typeTextSelected: {
    color: "#000000",
  },
  nextButton: {
    marginTop: 50,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#00ff41",
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#404040",
  },
  nextButtonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000000",
  },
});
