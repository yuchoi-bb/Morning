import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, Todo } from './types';

const TODOS_KEY = 'morning:todos';
const ALARMS_KEY = 'morning:alarms';

export async function loadTodos(): Promise<Todo[]> {
  const raw = await AsyncStorage.getItem(TODOS_KEY);
  return raw ? (JSON.parse(raw) as Todo[]) : [];
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export async function loadAlarms(): Promise<Alarm[]> {
  const raw = await AsyncStorage.getItem(ALARMS_KEY);
  return raw ? (JSON.parse(raw) as Alarm[]) : [];
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
}
