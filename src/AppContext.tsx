import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlarmSettings, Todo } from './types';
import { DEFAULT_ALARM, loadAlarm, loadTodos, saveAlarm, saveTodos } from './storage';
import { cancelAlarmNotifications, ensureNotificationSetup, scheduleAlarmNotifications } from './notifications';

interface AppContextValue {
  todos: Todo[];
  alarm: AlarmSettings;
  loading: boolean;
  addTodo: (text: string) => void;
  addTodos: (texts: string[]) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateAlarmTime: (hour: number, minute: number) => Promise<void>;
  updateAlarmCheckIns: (checkIntervalMinutes: number, maxCheckIns: number) => Promise<void>;
  setAlarmEnabled: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [alarm, setAlarm] = useState<AlarmSettings>(DEFAULT_ALARM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureNotificationSetup();
      const [t, a] = await Promise.all([loadTodos(), loadAlarm()]);
      setTodos(t);
      setAlarm(a);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) saveTodos(todos);
  }, [todos, loading]);

  useEffect(() => {
    if (!loading) saveAlarm(alarm);
  }, [alarm, loading]);

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: `${Date.now()}`, text: trimmed, done: false, createdAt: Date.now() },
    ]);
  }, []);

  const addTodos = useCallback((texts: string[]) => {
    const trimmed = texts.map((t) => t.trim()).filter(Boolean);
    if (trimmed.length === 0) return;
    setTodos((prev) => [
      ...prev,
      ...trimmed.map((text, i) => ({
        id: `${Date.now()}-${i}`,
        text,
        done: false,
        createdAt: Date.now() + i,
      })),
    ]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const rescheduleIfEnabled = useCallback(
    async (next: AlarmSettings) => {
      if (!next.enabled) return next;
      await cancelAlarmNotifications(next);
      const ids = await scheduleAlarmNotifications(next, todos);
      return { ...next, notificationIds: ids };
    },
    [todos]
  );

  const updateAlarmTime = useCallback(
    async (hour: number, minute: number) => {
      const next = await rescheduleIfEnabled({ ...alarm, hour, minute });
      setAlarm(next);
    },
    [alarm, rescheduleIfEnabled]
  );

  const updateAlarmCheckIns = useCallback(
    async (checkIntervalMinutes: number, maxCheckIns: number) => {
      const next = await rescheduleIfEnabled({ ...alarm, checkIntervalMinutes, maxCheckIns });
      setAlarm(next);
    },
    [alarm, rescheduleIfEnabled]
  );

  const setAlarmEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const ids = await scheduleAlarmNotifications({ ...alarm, enabled }, todos);
        setAlarm({ ...alarm, enabled: true, notificationIds: ids });
      } else {
        await cancelAlarmNotifications(alarm);
        setAlarm({ ...alarm, enabled: false, notificationIds: [] });
      }
    },
    [alarm, todos]
  );

  return (
    <AppContext.Provider
      value={{
        todos,
        alarm,
        loading,
        addTodo,
        addTodos,
        toggleTodo,
        removeTodo,
        updateAlarmTime,
        updateAlarmCheckIns,
        setAlarmEnabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
