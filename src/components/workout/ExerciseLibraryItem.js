import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default React.memo(function ExerciseLibraryItem({ item, themeColor, onSelect }) {
  return (
    <TouchableOpacity
      style={styles.libraryExerciseItem}
      onPress={() => onSelect(item)}
    >
      <View style={styles.exerciseThumbnail}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: themeColor + '20' }]}>
            <Text style={[styles.thumbnailText, { color: themeColor }]}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.libraryExerciseName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.libraryExerciseDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.exerciseTags}>
          <Text style={[styles.categoryTag, { borderColor: themeColor, color: themeColor }]}>
            {item.category}
          </Text>
          {item.muscle_groups && item.muscle_groups.length > 0 && (
            <Text style={styles.muscleTag}>{item.muscle_groups[0]}</Text>
          )}
        </View>
      </View>
      
      <Text style={[styles.selectIcon, { color: themeColor }]}>→</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  libraryExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  exerciseThumbnail: {
    marginRight: 12,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 24,
    fontWeight: '700',
  },
  exerciseInfo: {
    flex: 1,
  },
  libraryExerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  libraryExerciseDesc: {
    color: '#737373',
    fontSize: 13,
    marginBottom: 6,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  muscleTag: {
    fontSize: 10,
    color: '#737373',
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
});
