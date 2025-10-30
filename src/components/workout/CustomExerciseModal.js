import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native';

export default function CustomExerciseModal({
  visible,
  onClose,
  themeColor,
  exercise,
  saveToLibrary,
  onToggleSaveToLibrary,
  onUpdate,
  onSave,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColor }]}>Create Custom Exercise</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={[styles.inputLabel, { color: themeColor }]}>Exercise Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cable Fly"
              placeholderTextColor="#737373"
              value={exercise.name}
              onChangeText={(text) => onUpdate({ ...exercise, name: text })}
            />
            
            <Text style={[styles.inputLabel, { color: themeColor }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this exercise..."
              placeholderTextColor="#737373"
              value={exercise.description}
              onChangeText={(text) => onUpdate({ ...exercise, description: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.inputLabel, { color: themeColor }]}>Exercise Type</Text>
            <View style={styles.exerciseTypeRow}>
              {['weighted', 'bodyweight', 'duration'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.exerciseTypeButton,
                    exercise.exercise_type === type && { backgroundColor: themeColor }
                  ]}
                  onPress={() => onUpdate({ ...exercise, exercise_type: type })}
                >
                  <Text style={[
                    styles.exerciseTypeText,
                    exercise.exercise_type === type && { color: '#000' }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save to Library Toggle */}
            <View style={styles.saveToLibrarySection}>
              <View style={styles.saveToLibraryRow}>
                <View style={styles.saveToLibraryTextContainer}>
                  <Text style={styles.saveToLibraryText}>Save to my exercise library</Text>
                  <Text style={styles.saveToLibrarySubtext}>
                    You can reuse this exercise in future workouts
                  </Text>
                </View>
                <Switch
                  value={saveToLibrary}
                  onValueChange={onToggleSaveToLibrary}
                  trackColor={{ false: '#404040', true: themeColor + '80' }}
                  thumbColor={saveToLibrary ? themeColor : '#f4f3f4'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: themeColor }]}
              onPress={onSave}
            >
              <Text style={styles.modalButtonText}>
                {saveToLibrary ? 'Create & Add to Workout' : 'Create Exercise'}
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
  modalContent: { backgroundColor: '#141414', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#141414', borderWidth: 2, borderColor: '#262626', borderRadius: 8, padding: 16, color: '#ffffff', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  exerciseTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  exerciseTypeButton: { flex: 1, paddingVertical: 12, borderRadius: 6, borderWidth: 1, borderColor: '#404040', backgroundColor: '#262626', alignItems: 'center' },
  exerciseTypeText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  saveToLibrarySection: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  saveToLibraryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveToLibraryTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  saveToLibraryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  saveToLibrarySubtext: {
    color: '#737373',
    fontSize: 12,
  },
  modalButton: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  modalButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
