import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity } from 'react-native';

export default function ExerciseConfigModal({
  visible,
  onClose,
  themeColor,
  exercise,
  onUpdateExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onToggleBodyweight,
  onSave,
  onChangeExercise,
  canSave,
}) {
  const renderSetInput = (set, index) => {
    const exerciseType = exercise.exercise_type;

    return (
      <View key={index} style={styles.setInputRow}>
        <Text style={styles.setInputNumber}>Set {index + 1}</Text>
        
        {exerciseType === 'duration' && (
          <TextInput
            style={[styles.setInput, { flex: 2 }]}
            placeholder="Duration (seconds)"
            placeholderTextColor="#737373"
            value={set.duration}
            onChangeText={(text) => onUpdateSet(index, 'duration', text)}
            keyboardType="numeric"
          />
        )}

        {exerciseType === 'bodyweight' && (
          <TextInput
            style={[styles.setInput, { flex: 2 }]}
            placeholder="Reps"
            placeholderTextColor="#737373"
            value={set.reps}
            onChangeText={(text) => onUpdateSet(index, 'reps', text)}
            keyboardType="numeric"
          />
        )}

        {exerciseType === 'weighted' && (
          <>
            <TextInput
              style={styles.setInput}
              placeholder="Reps"
              placeholderTextColor="#737373"
              value={set.reps}
              onChangeText={(text) => onUpdateSet(index, 'reps', text)}
              keyboardType="numeric"
            />
            {!set.isBodyweight ? (
              <TextInput
                style={styles.setInput}
                placeholder="Weight (kg)"
                placeholderTextColor="#737373"
                value={set.weight}
                onChangeText={(text) => onUpdateSet(index, 'weight', text)}
                keyboardType="numeric"
              />
            ) : (
              <View style={[styles.setInput, styles.bwLabel]}>
                <Text style={[styles.bwText, { color: themeColor }]}>BW</Text>
              </View>
            )}
            <TouchableOpacity 
              style={[
                styles.bwToggle, 
                { borderColor: themeColor },
                set.isBodyweight && { backgroundColor: themeColor }
              ]}
              onPress={() => onToggleBodyweight(index)}
            >
              <Text style={[styles.bwToggleText, { color: themeColor }, set.isBodyweight && { color: '#000' }]}>
                BW
              </Text>
            </TouchableOpacity>
          </>
        )}

        {exercise.sets.length > 1 && (
          <TouchableOpacity onPress={() => onRemoveSet(index)} style={styles.removeSetButton}>
            <Text style={styles.removeSetButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColor }]}>
              {exercise.id ? 'Edit Exercise' : 'Add Exercise'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <TouchableOpacity 
              style={[styles.input, styles.exerciseNameDisplay]}
              onPress={onChangeExercise}
            >
              <Text style={styles.exerciseNameText}>{exercise.name}</Text>
              <Text style={[styles.changeExerciseText, { color: themeColor }]}>Change →</Text>
            </TouchableOpacity>

            <View style={styles.setsSectionHeader}>
              <Text style={[styles.inputLabel, { color: themeColor }]}>
                Sets ({exercise.sets.length})
              </Text>
              <TouchableOpacity 
                style={[styles.addSetButton, { backgroundColor: themeColor }]} 
                onPress={onAddSet}
              >
                <Text style={styles.addSetButtonText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
            
            {exercise.sets.map(renderSetInput)}

            <Text style={[styles.inputLabel, { color: themeColor }]}>
              Rest Between Sets (seconds)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="90"
              placeholderTextColor="#737373"
              keyboardType="numeric"
              value={exercise.rest}
              onChangeText={(text) => onUpdateExercise({ ...exercise, rest: text.replace(/[^0-9]/g, '') })}
            />
            
            <Text style={[styles.inputLabel, { color: themeColor }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Special instructions, form cues..."
              placeholderTextColor="#737373"
              value={exercise.notes}
              onChangeText={(text) => onUpdateExercise({ ...exercise, notes: text })}
              multiline
              numberOfLines={2}
            />
            
            <TouchableOpacity
              style={[
                styles.modalButton, 
                !canSave && styles.modalButtonDisabled, 
                { backgroundColor: themeColor }
              ]}
              onPress={onSave}
              disabled={!canSave}
            >
              <Text style={styles.modalButtonText}>
                {exercise.id ? 'Save Changes' : 'Add Exercise'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  input: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, color: '#ffffff', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  exerciseNameDisplay: {
    backgroundColor: '#262626',
    borderColor: '#404040',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNameText: { color: '#ffffff', fontSize: 16, fontWeight: '600', flex: 1 },
  changeExerciseText: { fontSize: 14, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  setsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addSetButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addSetButtonText: { color: '#000', fontSize: 12, fontWeight: '700' },
  setInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  setInputNumber: { color: '#ffffff', fontSize: 14, fontWeight: '600', width: 50 },
  setInput: { flex: 1, backgroundColor: '#262626', borderWidth: 1, borderColor: '#404040', borderRadius: 6, padding: 10, color: '#ffffff', fontSize: 14 },
  bwLabel: { justifyContent: 'center', alignItems: 'center' },
  bwText: { fontSize: 14, fontWeight: '700' },
  bwToggle: { backgroundColor: '#262626', borderWidth: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  bwToggleText: { fontSize: 12, fontWeight: '700' },
  removeSetButton: { backgroundColor: '#ff4444', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  removeSetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  modalButtonDisabled: { backgroundColor: '#404040' },
  modalButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
