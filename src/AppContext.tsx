import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alarm, Todo } from './types';
import { loadAlarms, loadTodos, saveAlarms, saveTodos } from './storage';
import { cancelAlarmNotifications, ensureNotificationSetup, scheduleAlarmNotifications } from './notifications';

interface AppContextValue {
  todos: Todo[];
  alarms: Alarm[];
  loading: boolean;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  addAlarm: (alarm: Omit<Alarm, 'id' | 'notificationIds'>) => Promise<void>;
  removeAlarm: (id: string) => Promise<void>;
  toggleAlarmEnabled: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureNotificationSetup();
      const [t, a] = await Promise.all([loadTodos(), loadAlarms()]);
      setTodos(t);
      setAlarms(a);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) saveTodos(todos);
  }, [todos, loading]);

  useEffect(() => {
    if (!loading) saveAlarms(alarms);
  }, [alarms, loading]);

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: `${Date.now()}`, text: trimmed, done: false, createdAt: Date.now() },
    ]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addAlarm = useCallback(
    async (partial: Omit<Alarm, 'id' | 'notificationIds'>) => {
      const alarm: Alarm = { ...partial, id: `${Date.now()}`, notificationIds: [] };
      const ids = partial.enabled ? await scheduleAlarmNotifications(alarm, todos) : [];
      setAlarms((prev) => [...prev, { ...alarm, notificationIds: ids }]);
    },
    [todos]
  );

  const removeAlarm = useCallback(
    async (id: string) => {
      const target = alarms.find((a) => a.id === id);
      if (target) await cancelAlarmNotifications(target);
      setAlarms((prev) => prev.filter((a) => a.id !== id));
    },
    [alarms]
  );

  const toggleAlarmEnabled = useCallback(
    async (id: string) => {
      const target = alarms.find((a) => a.id === id);
      if (!target) return;
      if (target.enabled) {
        await cancelAlarmNotifications(target);
        setAlarms((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled: false, notificationIds: [] } : a))
        );
      } else {
        const ids = await scheduleAlarmNotifications(target, todos);
        setAlarms((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled: true, notificationIds: ids } : a))
        );
      }
    },
    [alarms, todos]
  );

  return (
    <AppContext.Provider
      value={{
        todos,
        alarms,
        loading,
        addTodo,
        toggleTodo,
        removeTodo,
        addAlarm,
        removeAlarm,
        toggleAlarmEnabled,
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
