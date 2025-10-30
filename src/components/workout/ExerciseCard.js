import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ExerciseCard({ exercise, index, themeColor, onPress, onRemove }) {
  const renderSet = (set, idx) => (
    <View key={idx} style={styles.setRow}>
      <View style={styles.setNumber}>
        <Text style={styles.setNumberText}>{idx + 1}</Text>
      </View>
      <View style={styles.setDetails}>
        {set.duration && <Text style={styles.setDetailText}>{set.duration}s</Text>}
        {set.reps && <Text style={styles.setDetailText}>{set.reps} reps</Text>}
        {set.weight && (
          <Text style={styles.setDetailText}>
            {set.isBodyweight || set.weight === 'BW' ? 'BW' : `${set.weight}kg`}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity style={styles.exerciseCard} onPress={onPress}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseNumber, { backgroundColor: themeColor }]}>
          {index + 1}
        </Text>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={styles.removeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.setsContainer}>
        <Text style={[styles.setsLabel, { color: themeColor }]}>
          Sets ({exercise.sets.length})
        </Text>
        {exercise.sets.map(renderSet)}
      </View>
      {exercise.rest ? (
        <Text style={styles.restText}>⏱️ Rest: {exercise.rest}s</Text>
      ) : null}
      {exercise.notes ? (
        <Text style={styles.exerciseNotes}>📝 {exercise.notes}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
