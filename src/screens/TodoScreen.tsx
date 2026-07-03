import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp } from '../AppContext';
import { Todo } from '../types';

export default function TodoScreen() {
  const { todos, addTodo, toggleTodo, removeTodo } = useApp();
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text);
    setText('');
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <View style={styles.row}>
      <Pressable style={styles.checkRow} onPress={() => toggleTodo(item.id)}>
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
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>아직 등록된 아침 할일이 없어요.{'\n'}아래에서 추가해보세요.</Text>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="예: 이불 정리하기"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>추가</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e2e2',
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: { backgroundColor: '#4F46E5' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  todoText: { fontSize: 16, color: '#1a1a1a', flexShrink: 1 },
  todoTextDone: { textDecorationLine: 'line-through', color: '#aaa' },
  deleteText: { color: '#e11d48', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e2e2',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
