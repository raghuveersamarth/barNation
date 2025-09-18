import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Alert } from 'react-native';
import Button from '../../components/common/Button.js';

export default function WorkoutScreen({ route }) {
  const { exercises } = route.params;
  const [logs, setLogs] = useState({});

  const updateLog = (id, field, value) => {
    setLogs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const submitWorkout = () => {
    for (const ex of exercises) {
      const log = logs[ex.id];
      if (!log?.sets || !log?.reps) {
        Alert.alert('Error', `Please enter sets and reps for ${ex.name}`);
        return;
      }
    }
    // Save logs logic here
  };

  const renderExercise = ({ item }) => {
    const log = logs[item.id] || {};
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.inputsRow}>
          <TextInput
            placeholder="Sets"
            keyboardType="numeric"
            style={styles.input}
            value={log.sets || ''}
            onChangeText={val => updateLog(item.id, 'sets', val)}
          />
          <TextInput
            placeholder="Reps"
            keyboardType="numeric"
            style={styles.input}
            value={log.reps || ''}
            onChangeText={val => updateLog(item.id, 'reps', val)}
          />
          <TextInput
            placeholder="Weight"
            keyboardType="numeric"
            style={styles.input}
            value={log.weight || ''}
            onChangeText={val => updateLog(item.id, 'weight', val)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={exercises} keyExtractor={item => item.id.toString()} renderItem={renderExercise} />
      <Button title="Mark Workout Complete" onPress={submitWorkout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: { color: '#00ff41', fontWeight: '700', fontSize: 18, marginBottom: 12 },
  inputsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#eaffd0',
    marginRight: 8,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#262626',
    fontSize: 16,
  },
});
