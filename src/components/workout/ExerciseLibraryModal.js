import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import DraggableModal from '../common/DraggableModal';
import ExerciseLibraryItem from './ExerciseLibraryItem';

export default function ExerciseLibraryModal({
  visible,
  onClose,
  themeColor,
  exercises,
  searchQuery,
  onSearchChange,
  showAllExercises,
  onShowAll,
  loading,
  onSelectExercise,
  onCreateCustom,
}) {
  return (
    <DraggableModal visible={visible} onClose={onClose}>
      <View style={styles.swipeIndicator}>
        <View style={styles.swipeHandle} />
      </View>

      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: themeColor }]}>Exercise Library</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalClose}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#737373"
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.customExerciseButton, { backgroundColor: themeColor }]}
        onPress={onCreateCustom}
      >
        <Text style={styles.customExerciseButtonText}>+ Create Custom Exercise</Text>
      </TouchableOpacity>

      {!searchQuery.trim() && !showAllExercises && (
        <TouchableOpacity 
          style={[styles.showAllButton, { borderColor: themeColor }]}
          onPress={onShowAll}
        >
          <Text style={[styles.showAllText, { color: themeColor }]}>
            Show All Exercises ({exercises.length} total)
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingLibrary}>
          <ActivityIndicator size="large" color={themeColor} />
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          renderItem={({ item }) => (
            <ExerciseLibraryItem
              item={item}
              themeColor={themeColor}
              onSelect={onSelectExercise}
            />
          )}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'No exercises available'}
              </Text>
            </View>
          }
        />
      )}
    </DraggableModal>
  );
}

const styles = StyleSheet.create({
  swipeIndicator: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  swipeHandle: { width: 40, height: 4, backgroundColor: '#404040', borderRadius: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#737373', fontSize: 28, fontWeight: '300' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#262626', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 12 },
  clearSearch: { color: '#737373', fontSize: 20, padding: 4 },
  customExerciseButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  customExerciseButtonText: { color: '#000', fontSize: 14, fontWeight: '700' },
  showAllButton: { borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  showAllText: { fontSize: 14, fontWeight: '700' },
  loadingLibrary: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: '#737373', fontSize: 14, marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#737373', fontSize: 14 },
});
