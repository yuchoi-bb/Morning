import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '../AppContext';
import Stepper from '../components/Stepper';
import { theme } from '../theme';
import { formatTime, parseMorningSentence } from '../timeParser';
import { RootStackParamList, Todo } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const {
    todos,
    alarm,
    addTodo,
    addTodos,
    toggleTodo,
    removeTodo,
    updateAlarmTime,
    updateAlarmCheckIns,
    setAlarmEnabled,
  } = useApp();
  const navigation = useNavigation<Nav>();

  const [manualText, setManualText] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    transcriptRef.current = text;
    setTranscript(text);
    if (/종료\s*$/.test(text.trim())) {
      ExpoSpeechRecognitionModule.stop();
    }
  });
  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
    const text = transcriptRef.current.replace(/종료\s*$/, '').trim();
    if (!text) return;

    const { time, tasks } = parseMorningSentence(text);
    if (tasks.length > 0) addTodos(tasks);
    if (time) {
      updateAlarmTime(time.hour, time.minute);
      if (!alarm.enabled) setAlarmEnabled(true);
    }

    const parts: string[] = [];
    if (time) parts.push(`알람 ${formatTime(time.hour, time.minute)}`);
    if (tasks.length > 0) parts.push(`할일 ${tasks.length}개 추가`);
    Alert.alert(
      '음성 입력 완료',
      parts.length > 0 ? parts.join(' · ') : '시간이나 할일을 알아듣지 못했어요. 다시 말해주세요.'
    );
  });
  useSpeechRecognitionEvent('error', (event) => {
    setRecognizing(false);
    Alert.alert('음성 인식 오류', event.message ?? event.error);
  });

  const handleMicPress = async () => {
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const available = ExpoSpeechRecognitionModule.isRecognitionAvailable?.() ?? true;
    if (!available) {
      Alert.alert(
        '음성 인식을 사용할 수 없어요',
        '이 환경(Expo Go 등)에서는 음성 인식 네이티브 모듈이 없어요. 개발 빌드로 실행하거나 아래에서 직접 입력해주세요.'
      );
      return;
    }
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert('권한이 필요해요', '마이크 및 음성 인식 권한을 허용해주세요.');
      return;
    }
    transcriptRef.current = '';
    setTranscript('');
    ExpoSpeechRecognitionModule.start({
      lang: 'ko-KR',
      interimResults: true,
      continuous: false,
      androidIntentOptions: {
        // Give pauses between words/tasks more room before auto-stopping.
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 5000,
        EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 15000,
      },
    });
  };

  const handleManualAdd = () => {
    if (!manualText.trim()) return;
    addTodo(manualText);
    setManualText('');
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoRow}>
      <Pressable style={styles.todoTouchable} onPress={() => toggleTodo(item.id)}>
        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
          {item.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.todoText, item.done && styles.todoTextDone]}>{item.text}</Text>
      </Pressable>
      <Pressable onPress={() => removeTodo(item.id)} hitSlop={8}>
        <Text style={styles.deleteText}>삭제</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={renderTodo}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.alarmCard}>
              <View style={styles.alarmHeaderRow}>
                <Text style={styles.alarmTime}>{formatTime(alarm.hour, alarm.minute)}</Text>
                <Switch value={alarm.enabled} onValueChange={setAlarmEnabled} />
              </View>

              <View style={styles.stepperGroup}>
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperLabel}>시</Text>
                  <Stepper value={alarm.hour} onChange={(h) => updateAlarmTime(h, alarm.minute)} max={23} />
                </View>
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperLabel}>분</Text>
                  <Stepper
                    value={alarm.minute}
                    onChange={(m) => updateAlarmTime(alarm.hour, m)}
                    max={59}
                    step={5}
                  />
                </View>
              </View>

              <View style={styles.stepperGroup}>
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperLabel}>다시 확인(분)</Text>
                  <Stepper
                    value={alarm.checkIntervalMinutes}
                    onChange={(v) => updateAlarmCheckIns(v, alarm.maxCheckIns)}
                    max={60}
                  />
                </View>
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperLabel}>횟수</Text>
                  <Stepper
                    value={alarm.maxCheckIns}
                    onChange={(v) => updateAlarmCheckIns(alarm.checkIntervalMinutes, v)}
                    max={10}
                  />
                </View>
              </View>

              <Pressable style={styles.testButton} onPress={() => navigation.navigate('AlarmRing')}>
                <Text style={styles.testButtonText}>지금 알람 테스트</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.micButton, recognizing && styles.micButtonActive]}
              onPress={handleMicPress}
            >
              <Text style={styles.micButtonText}>
                {recognizing ? '듣는 중… 탭하여 멈추기' : '🎤 말해서 시간·할일 한번에 추가'}
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              예: "아침 7시 반에 이불정리하고 아침먹고 강아지 산책시키기"{'\n'}
              (말이 끝나면 "종료"라고 말하거나 5초간 멈추면 자동으로 끝나요)
            </Text>
            {transcript ? <Text style={styles.transcript}>인식된 문장: {transcript}</Text> : null}

            <Text style={styles.sectionTitle}>할일 목록</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>아직 등록된 아침 할일이 없어요.</Text>}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="할일 직접 입력하기"
          placeholderTextColor={theme.subtext}
          value={manualText}
          onChangeText={setManualText}
          onSubmitEditing={handleManualAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleManualAdd}>
          <Text style={styles.addButtonText}>추가</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  listContent: { padding: 16, flexGrow: 1 },
  alarmCard: { backgroundColor: theme.card, borderRadius: 16, padding: 20, gap: 16 },
  alarmHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alarmTime: { fontSize: 26, fontWeight: '800', color: theme.text },
  stepperGroup: { flexDirection: 'row', gap: 28 },
  stepperCol: { alignItems: 'center' },
  stepperLabel: { fontSize: 12, color: theme.subtext, marginBottom: 6 },
  testButton: {
    backgroundColor: theme.cardAlt,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  testButtonText: { color: theme.accent, fontWeight: '700', fontSize: 13 },
  micButton: {
    backgroundColor: theme.cardAlt,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  micButtonActive: { backgroundColor: theme.accentStrong },
  micButtonText: { fontSize: 15, fontWeight: '700', color: theme.accent },
  hint: { fontSize: 12, color: theme.subtext, marginTop: 8, textAlign: 'center' },
  transcript: { fontSize: 13, color: theme.text, marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 24, marginBottom: 8 },
  empty: { textAlign: 'center', color: theme.subtext, marginTop: 20, lineHeight: 22 },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  todoTouchable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: { backgroundColor: theme.accent },
  checkmark: { color: theme.bg, fontSize: 14, fontWeight: '700' },
  todoText: { fontSize: 16, color: theme.text, flexShrink: 1 },
  todoTextDone: { textDecorationLine: 'line-through', color: theme.subtext },
  deleteText: { color: theme.danger, fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.card,
  },
  addButton: {
    backgroundColor: theme.accentStrong,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
