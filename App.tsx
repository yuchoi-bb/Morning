import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { AppProvider } from './src/AppContext';
import AddAlarmScreen from './src/screens/AddAlarmScreen';
import AlarmListScreen from './src/screens/AlarmListScreen';
import AlarmRingScreen from './src/screens/AlarmRingScreen';
import TodoScreen from './src/screens/TodoScreen';
import { RootStackParamList } from './src/types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tab.Screen name="할일" component={TodoScreen} />
      <Tab.Screen name="알람" component={AlarmListScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const handleNotification = (data: unknown) => {
      const alarmId = (data as { alarmId?: string } | undefined)?.alarmId;
      if (alarmId) {
        navigationRef.current?.navigate('AlarmRing', { alarmId });
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      handleNotification(notification.request.content.data);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotification(response.notification.request.content.data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <AppProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddAlarm" component={AddAlarmScreen} options={{ title: '알람 추가' }} />
          <Stack.Screen
            name="AlarmRing"
            component={AlarmRingScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
