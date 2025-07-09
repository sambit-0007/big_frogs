import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = '@big_frogs_tasks';
const DAILY_KEY = '@daily_tasks';

function BigFrogsScreen() {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('1');

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      let stored = jsonValue != null ? JSON.parse(jsonValue) : { lastDate: null, tasks: [] };
      const today = new Date().toISOString().split('T')[0];
      let currentTasks = stored.tasks || [];
      if (stored.lastDate !== today) {
        currentTasks = currentTasks.filter(t => !t.completed).map(t => ({ ...t, priority: 1 }));
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
    const newTask = { id: Date.now().toString(), text: taskText, priority: parseInt(taskPriority) || 1, completed: false };
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
        <TextInput style={styles.input} placeholder="Add Big Frog" value={taskText} onChangeText={setTaskText} />
        <TextInput style={styles.priorityInput} placeholder="Priority" value={taskPriority} keyboardType="numeric" onChangeText={setTaskPriority} />
        <TouchableOpacity onPress={addTask} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={tasks} keyExtractor={item => item.id} renderItem={renderItem} />
    </SafeAreaView>
  );
}

function DailyTasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');

  useEffect(() => { loadTasks(); requestPermissions(); }, []);
  useEffect(() => { updateNotification(); }, [tasks]);

  async function requestPermissions() {
    await Notifications.requestPermissionsAsync();
  }

  async function loadTasks() {
    try {
      const jsonValue = await AsyncStorage.getItem(DAILY_KEY);
      let stored = jsonValue != null ? JSON.parse(jsonValue) : { lastDate: null, tasks: [] };
      const today = new Date().toISOString().split('T')[0];
      if (stored.lastDate !== today) {
        stored.tasks = stored.tasks.map(t => ({ ...t, completed: false }));
        stored.lastDate = today;
        await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(stored));
      }
      setTasks(stored.tasks);
    } catch (e) {
      console.error('Failed to load daily tasks', e);
    }
  }

  async function saveTasks(updatedTasks) {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(DAILY_KEY, JSON.stringify({ lastDate: today, tasks: updatedTasks }));
      setTasks(updatedTasks);
    } catch (e) {
      console.error('Failed to save daily tasks', e);
    }
  }

  function addTask() {
    if (!taskText) return;
    const newTask = { id: Date.now().toString(), text: taskText, completed: false };
    const updated = [...tasks, newTask];
    saveTasks(updated);
    setTaskText('');
  }

  function toggleTask(id) {
    const updated = tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  }

  async function updateNotification() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const incomplete = tasks.some(t => !t.completed);
    if (incomplete) {
      const now = new Date();
      const trigger = new Date();
      trigger.setHours(21, 0, 0, 0); // 9 PM reminder
      if (trigger <= now) {
        trigger.setDate(trigger.getDate() + 1);
      }
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Daily Tasks Reminder', body: 'You have pending daily tasks!' },
        trigger,
      });
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.item}>
      <Text style={item.completed ? styles.completed : styles.text}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Add Daily Task" value={taskText} onChangeText={setTaskText} />
        <TouchableOpacity onPress={addTask} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={tasks} keyExtractor={item => item.id} renderItem={renderItem} />
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Big Frogs" component={BigFrogsScreen} />
        <Tab.Screen name="Daily Tasks" component={DailyTasksScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
  priorityInput: { width: 60, marginLeft: 8, borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 4 },
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, justifyContent: 'center', marginLeft: 8, borderRadius: 4 },
  addButtonText: { color: '#fff' },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  text: { fontSize: 16 },
  completed: { fontSize: 16, textDecorationLine: 'line-through', color: '#999' },
});
