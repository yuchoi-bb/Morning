import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { checkForUpdate, downloadAndInstall, UpdateInfo } from '../updateChecker';

type Status = 'idle' | 'checking' | 'available' | 'downloading' | 'error';

export default function UpdateBanner() {
  const [status, setStatus] = useState<Status>('idle');
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('checking');
    checkForUpdate()
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setUpdate(found);
          setStatus('available');
        } else {
          setStatus('idle');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('idle');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'idle' || status === 'checking') return null;

  const handleInstall = async () => {
    if (!update) return;
    setStatus('downloading');
    setProgress(0);
    try {
      await downloadAndInstall(update, setProgress);
    } catch (err) {
      setStatus('error');
      Alert.alert('업데이트 실패', err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    }
  };

  return (
    <View style={styles.banner}>
      {status === 'downloading' ? (
        <View style={styles.row}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.text}>다운로드 중… {Math.round(progress * 100)}%</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <Text style={styles.text}>새 버전이 있어요 ({update?.releaseName})</Text>
          <Pressable style={styles.button} onPress={handleInstall}>
            <Text style={styles.buttonText}>업데이트</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: { color: '#fff', fontSize: 13, flexShrink: 1 },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
