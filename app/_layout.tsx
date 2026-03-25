import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { NavigationTheme } from '@/constants/Colors';
import { ThemeProvider } from '@react-navigation/native';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const HEADER_STYLE = { backgroundColor: '#000' };
const HEADER_TINT = '#FFD700';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={NavigationTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="result"
          options={{
            title: '読み取り結果',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: '読み取り履歴',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: '設定',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
            presentation: 'modal',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
