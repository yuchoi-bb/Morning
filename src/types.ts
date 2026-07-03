export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface AlarmSettings {
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  checkIntervalMinutes: number; // how often to re-prompt after the alarm rings
  maxCheckIns: number; // how many times to re-prompt
  notificationIds: string[]; // scheduled local notification ids (main + follow-ups)
}

export type RootStackParamList = {
  Home: undefined;
  AlarmRing: undefined;
};
