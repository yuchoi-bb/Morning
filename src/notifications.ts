import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AlarmSettings, Todo } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = 'alarms';

// Local scheduled notifications aren't supported on web; the alarm-ring flow
// still works there via in-app timers, it just won't fire while backgrounded.
const NOTIFICATIONS_SUPPORTED = Platform.OS !== 'web';

export async function ensureNotificationSetup(): Promise<boolean> {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '아침 알람',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAlarmNotifications(alarm: AlarmSettings): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await Promise.all(
    alarm.notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
}

function addMinutesToTime(hour: number, minute: number, minutesToAdd: number) {
  const total = hour * 60 + minute + minutesToAdd;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

export async function scheduleAlarmNotifications(
  alarm: AlarmSettings,
  todos: Todo[]
): Promise<string[]> {
  if (!NOTIFICATIONS_SUPPORTED) return [];
  const ids: string[] = [];
  const pendingCount = todos.filter((t) => !t.done).length;

  const mainId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '아침 알람',
      body: pendingCount > 0 ? `오늘 할일 ${pendingCount}개가 남아있어요!` : '좋은 아침이에요!',
      sound: 'default',
      data: { kind: 'main' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: alarm.hour,
      minute: alarm.minute,
      channelId: CHANNEL_ID,
    },
  });
  ids.push(mainId);

  for (let i = 1; i <= alarm.maxCheckIns; i++) {
    const { hour, minute } = addMinutesToTime(alarm.hour, alarm.minute, alarm.checkIntervalMinutes * i);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '아직 안 끝났어요!',
        body: '아침 할일을 확인해보세요.',
        sound: 'default',
        data: { kind: 'checkin', index: i },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    ids.push(id);
  }

  return ids;
}
