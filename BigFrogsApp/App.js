import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@big_frogs_tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('1');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      let stored = jsonValue != null ? JSON.parse(jsonValue) : { lastDate: null, tasks: [] };
      const today = new Date().toISOString().split('T')[0];
      let currentTasks = stored.tasks || [];
      if (stored.lastDate !== today) {
        // carry over incomplete tasks to today with priority 1
        currentTasks = currentTasks
          .filter(t => !t.completed)
          .map(t => ({ ...t, priority: 1 }));
        stored = { lastDate: today, tasks: currentTasks };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
      setTasks(currentTasks.sort((a, b) => a.priority - b.priority));
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  }

  async function saveTasks(updatedTasks) {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ lastDate: today, tasks: updatedTasks }));
      setTasks(updatedTasks.sort((a, b) => a.priority - b.priority));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }

  function addTask() {
    if (!taskText) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskText,
      priority: parseInt(taskPriority) || 1,
      completed: false,
    };
    const updated = [...tasks, newTask];
    saveTasks(updated);
    setTaskText('');
    setTaskPriority('1');
  }

  function toggleTask(id) {
    const updated = tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.item}>
      <Text style={item.completed ? styles.completed : styles.text}>{`[${item.priority}] ${item.text}`}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add Big Frog"
          value={taskText}
          onChangeText={setTaskText}
        />
        <TextInput
          style={styles.priorityInput}
          placeholder="Priority"
          value={taskPriority}
          keyboardType="numeric"
          onChangeText={setTaskPriority}
        />
        <TouchableOpacity onPress={addTask} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  priorityInput: {
    width: 60,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  text: {
    fontSize: 16,
  },
  completed: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: '#999',
  },
});
