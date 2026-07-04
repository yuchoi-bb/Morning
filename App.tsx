import { DarkTheme, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider } from './src/AppContext';
import UpdateBanner from './src/components/UpdateBanner';
import AlarmRingScreen from './src/screens/AlarmRingScreen';
import HomeScreen from './src/screens/HomeScreen';
import { theme } from './src/theme';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.bg,
    card: theme.card,
    text: theme.text,
    border: theme.border,
    primary: theme.accent,
  },
};

function AppContent() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const handleNotification = () => {
      navigationRef.current?.navigate('AlarmRing');
    };

    const receivedSub = Notifications.addNotificationReceivedListener(handleNotification);
    const responseSub = Notifications.addNotificationResponseReceivedListener(handleNotification);

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style="light" />
      <UpdateBanner topInset={insets.top} />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '모닝' }} />
          <Stack.Screen
            name="AlarmRing"
            component={AlarmRingScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
