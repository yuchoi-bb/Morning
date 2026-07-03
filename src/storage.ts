import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlarmSettings, Todo } from './types';

const TODOS_KEY = 'morning:todos';
const ALARM_KEY = 'morning:alarm';

export const DEFAULT_ALARM: AlarmSettings = {
  hour: 7,
  minute: 0,
  enabled: false,
  checkIntervalMinutes: 5,
  maxCheckIns: 3,
  notificationIds: [],
};

export async function loadTodos(): Promise<Todo[]> {
  const raw = await AsyncStorage.getItem(TODOS_KEY);
  return raw ? (JSON.parse(raw) as Todo[]) : [];
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export async function loadAlarm(): Promise<AlarmSettings> {
  const raw = await AsyncStorage.getItem(ALARM_KEY);
  return raw ? { ...DEFAULT_ALARM, ...(JSON.parse(raw) as AlarmSettings) } : DEFAULT_ALARM;
}

export async function saveAlarm(alarm: AlarmSettings): Promise<void> {
  await AsyncStorage.setItem(ALARM_KEY, JSON.stringify(alarm));
}
