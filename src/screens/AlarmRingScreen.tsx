import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../AppContext';
import { speak, stopSpeaking } from '../speech';
import { formatTime } from '../timeParser';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RingRoute = RouteProp<RootStackParamList, 'AlarmRing'>;

function buildTodoSpeech(pendingTexts: string[]): string {
  if (pendingTexts.length === 0) {
    return '좋은 아침이에요! 오늘 할 일이 모두 끝나있어요. 멋져요!';
  }
  const list = pendingTexts.map((t, i) => `${i + 1}, ${t}`).join('. ');
  return `좋은 아침이에요! 오늘 아침 할 일은 ${pendingTexts.length}개예요. ${list}.`;
}

export default function AlarmRingScreen() {
  const { alarms, todos, toggleTodo } = useApp();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RingRoute>();
  const alarm = alarms.find((a) => a.id === route.params.alarmId);

  const [checkInCount, setCheckInCount] = useState(0);
  const [secondsToNext, setSecondsToNext] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingTodos = todos.filter((t) => !t.done);

  useEffect(() => {
    speak(buildTodoSpeech(pendingTodos.map((t) => t.text)));
    return () => stopSpeaking();
    // Only announce once when the screen first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalMinutes = alarm?.checkIntervalMinutes ?? 5;
    const maxCheckIns = alarm?.maxCheckIns ?? 3;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    if (checkInCount >= maxCheckIns) return;
    if (pendingTodos.length === 0) return;

    let remaining = Math.floor(intervalMs / 1000);
    setSecondsToNext(remaining);
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsToNext(remaining > 0 ? remaining : 0);
    }, 1000);

    timerRef.current = setInterval(() => {
      const stillPending = pendingTodos;
      if (stillPending.length === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      speak(
        `아직 안 끝난 할 일이 있어요. ${stillPending.map((t) => t.text).join(', ')}. 다 하셨으면 화면에서 완료를 눌러주세요.`
      );
      setCheckInCount((c) => c + 1);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInCount, alarm?.checkIntervalMinutes, alarm?.maxCheckIns, pendingTodos.length]);

  const handleDismiss = () => {
    stopSpeaking();
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    navigation.navigate('Tabs');
  };

  const formatCountdown = (secs: number | null) => {
    if (secs === null) return null;
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{alarm ? formatTime(alarm.hour, alarm.minute) : ''}</Text>
      <Text style={styles.title}>{alarm?.label || '아침 알람'}</Text>

      <View style={styles.todoBox}>
        {pendingTodos.length === 0 ? (
          <Text style={styles.doneText}>오늘 할 일을 모두 끝냈어요 🎉</Text>
        ) : (
          pendingTodos.map((t) => (
            <Pressable key={t.id} style={styles.todoRow} onPress={() => toggleTodo(t.id)}>
              <View style={styles.checkbox} />
              <Text style={styles.todoText}>{t.text}</Text>
            </Pressable>
          ))
        )}
      </View>

      {secondsToNext !== null && pendingTodos.length > 0 && (
        <Text style={styles.countdown}>다음 확인까지 {formatCountdown(secondsToNext)}</Text>
      )}

      <Pressable
        style={styles.replayButton}
        onPress={() => speak(buildTodoSpeech(pendingTodos.map((t) => t.text)))}
      >
        <Text style={styles.replayButtonText}>다시 듣기</Text>
      </Pressable>

      <Pressable style={styles.dismissButton} onPress={handleDismiss}>
        <Text style={styles.dismissButtonText}>알람 끄기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', padding: 24, paddingTop: 80 },
  time: { fontSize: 48, fontWeight: '800', color: '#fff' },
  title: { fontSize: 18, color: '#c7c7e0', marginTop: 4, marginBottom: 32 },
  todoBox: { width: '100%', backgroundColor: '#252547', borderRadius: 16, padding: 20, gap: 12 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#8b8bd6' },
  todoText: { color: '#fff', fontSize: 16, flexShrink: 1 },
  doneText: { color: '#a5f3c0', fontSize: 16, textAlign: 'center' },
  countdown: { color: '#8b8bd6', marginTop: 20, fontSize: 14 },
  replayButton: {
    marginTop: 36,
    borderWidth: 1,
    borderColor: '#8b8bd6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  replayButtonText: { color: '#c7c7e0', fontSize: 15 },
  dismissButton: {
    marginTop: 16,
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  dismissButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
