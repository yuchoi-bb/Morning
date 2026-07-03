import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export default function Stepper({
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
    <View style={styles.row}>
      <Pressable style={styles.button} onPress={() => onChange(clamp(value - step))}>
        <Text style={styles.buttonText}>–</Text>
      </Pressable>
      <Text style={styles.value}>{value.toString().padStart(2, '0')}</Text>
      <Pressable style={styles.button} onPress={() => onChange(clamp(value + step))}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 20, color: theme.accent, fontWeight: '700' },
  value: { fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center', color: theme.text },
});
