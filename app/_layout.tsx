import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { NavigationTheme } from '@/constants/Colors';
import { ThemeProvider } from '@react-navigation/native';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const HEADER_STYLE = { backgroundColor: '#000' };
const HEADER_TINT = '#FFD700';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { hasSeenOnboarding, isLoaded, loadOnboardingState } =
    useOnboardingStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadOnboardingState();
  }, [loadOnboardingState]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isLoaded) {
      SplashScreen.hideAsync();

      // Redirect to onboarding if first time
      if (!hasSeenOnboarding && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
    }
  }, [loaded, isLoaded, hasSeenOnboarding, segments, router]);

  if (!loaded || !isLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={NavigationTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="read/camera"
          options={{
            title: '書類を撮影',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="read/result"
          options={{
            title: '読み取り結果',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
          }}
        />
        <Stack.Screen
          name="read/history"
          options={{
            title: '読み取り履歴',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
          }}
        />
        <Stack.Screen
          name="see/camera"
          options={{
            title: '周囲を撮影',
            headerStyle: HEADER_STYLE,
            headerTintColor: HEADER_TINT,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="see/result"
          options={{
            title: '周囲の説明',
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
