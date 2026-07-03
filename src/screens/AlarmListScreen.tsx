import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useApp } from '../AppContext';
import { formatTime } from '../timeParser';
import { Alarm, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AlarmListScreen() {
  const { alarms, removeAlarm, toggleAlarmEnabled } = useApp();
  const navigation = useNavigation<Nav>();

  const renderItem = ({ item }: { item: Alarm }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.time}>{formatTime(item.hour, item.minute)}</Text>
        <Text style={styles.label}>{item.label || '알람'}</Text>
        <Text style={styles.meta}>
          {item.checkIntervalMinutes}분마다 {item.maxCheckIns}번 다시 확인
        </Text>
      </View>
      <View style={styles.actions}>
        <Switch value={item.enabled} onValueChange={() => toggleAlarmEnabled(item.id)} />
        <Pressable
          style={styles.testButton}
          onPress={() => navigation.navigate('AlarmRing', { alarmId: item.id })}
        >
          <Text style={styles.testButtonText}>테스트</Text>
        </Pressable>
        <Pressable onPress={() => removeAlarm(item.id)} hitSlop={8}>
          <Text style={styles.deleteText}>삭제</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>등록된 알람이 없어요.{'\n'}오른쪽 아래 버튼으로 추가해보세요.</Text>
        }
      />
      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddAlarm')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, lineHeight: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f7fb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  time: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  label: { fontSize: 14, color: '#555', marginTop: 2 },
  meta: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { alignItems: 'flex-end', gap: 8 },
  testButton: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  testButtonText: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },
  deleteText: { color: '#e11d48', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
