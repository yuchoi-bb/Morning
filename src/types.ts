export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface Alarm {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  label: string;
  enabled: boolean;
  checkIntervalMinutes: number; // how often to re-prompt after the alarm rings
  maxCheckIns: number; // how many times to re-prompt
  notificationIds: string[]; // scheduled local notification ids (main + follow-ups)
}

export type RootStackParamList = {
  Tabs: undefined;
  AddAlarm: undefined;
  AlarmRing: { alarmId: string };
};
