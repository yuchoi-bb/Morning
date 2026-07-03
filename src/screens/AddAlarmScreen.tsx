import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useApp } from '../AppContext';
import { formatTime, parseSpokenTime } from '../timeParser';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Stepper({
  value,
  onChange,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
  step?: number;
}) {
  const clamp = (v: number) => ((v % (max + 1)) + (max + 1)) % (max + 1);
  return (
    <View style={styles.stepperRow}>
      <Pressable style={styles.stepperButton} onPress={() => onChange(clamp(value - step))}>
        <Text style={styles.stepperButtonText}>–</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value.toString().padStart(2, '0')}</Text>
      <Pressable style={styles.stepperButton} onPress={() => onChange(clamp(value + step))}>
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

export default function AddAlarmScreen() {
  const { addAlarm } = useApp();
  const navigation = useNavigation<Nav>();

  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [maxCheckIns, setMaxCheckIns] = useState(3);

  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    const parsed = parseSpokenTime(text);
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
    }
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
        '이 환경(Expo Go 등)에서는 음성 인식 네이티브 모듈이 없어요. 개발 빌드(EAS build 또는 expo run)로 실행하거나 아래 숫자 조절로 직접 시간을 입력해주세요.'
      );
      return;
    }
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert('권한이 필요해요', '마이크 및 음성 인식 권한을 허용해주세요.');
      return;
    }
    setTranscript('');
    ExpoSpeechRecognitionModule.start({
      lang: 'ko-KR',
      interimResults: true,
      continuous: false,
    });
  };

  const handleSave = async () => {
    await addAlarm({
      hour,
      minute,
      label: label.trim(),
      enabled: true,
      checkIntervalMinutes: Math.max(1, intervalMinutes),
      maxCheckIns: Math.max(0, maxCheckIns),
    });
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>말로 시간 설정하기</Text>
      <Pressable
        style={[styles.micButton, recognizing && styles.micButtonActive]}
        onPress={handleMicPress}
      >
        <Text style={styles.micButtonText}>{recognizing ? '듣는 중… 탭하여 멈추기' : '🎤 눌러서 말하기'}</Text>
      </Pressable>
      <Text style={styles.hint}>예: "아침 7시 30분" / "일곱시 반" / "오후 8시"</Text>
      {transcript ? <Text style={styles.transcript}>인식된 문장: {transcript}</Text> : null}

      <Text style={styles.sectionTitle}>알람 시간</Text>
      <Text style={styles.previewTime}>{formatTime(hour, minute)}</Text>
      <View style={styles.stepperGroup}>
        <View style={styles.stepperCol}>
          <Text style={styles.stepperLabel}>시</Text>
          <Stepper value={hour} onChange={setHour} max={23} />
        </View>
        <View style={styles.stepperCol}>
          <Text style={styles.stepperLabel}>분</Text>
          <Stepper value={minute} onChange={setMinute} max={59} step={5} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>알람 이름</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 기상 알람"
        value={label}
        onChangeText={setLabel}
      />

      <Text style={styles.sectionTitle}>다시 확인하기 설정</Text>
      <View style={styles.stepperGroup}>
        <View style={styles.stepperCol}>
          <Text style={styles.stepperLabel}>간격(분)</Text>
          <Stepper value={intervalMinutes} onChange={setIntervalMinutes} max={60} step={1} />
        </View>
        <View style={styles.stepperCol}>
          <Text style={styles.stepperLabel}>횟수</Text>
          <Stepper value={maxCheckIns} onChange={setMaxCheckIns} max={10} step={1} />
        </View>
      </View>
      <Text style={styles.hint}>
        알람이 울린 뒤 {intervalMinutes}분마다 최대 {maxCheckIns}번, 할일을 다 했는지 다시 물어봐요.
      </Text>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>알람 저장</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 8, paddingBottom: 60 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 20 },
  micButton: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  micButtonActive: { backgroundColor: '#4F46E5' },
  micButtonText: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  hint: { fontSize: 12, color: '#999', marginTop: 6 },
  transcript: { fontSize: 14, color: '#333', marginTop: 8 },
  previewTime: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', marginTop: 6 },
  stepperGroup: { flexDirection: 'row', gap: 24, marginTop: 8 },
  stepperCol: { alignItems: 'center' },
  stepperLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 20, color: '#4F46E5', fontWeight: '700' },
  stepperValue: { fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
