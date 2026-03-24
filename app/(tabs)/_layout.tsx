import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.borderSubtle,
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 30,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '読む',
          tabBarAccessibilityLabel: '読む：書類を読み取る',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'doc.text.viewfinder', android: 'document_scanner', web: 'document_scanner' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="see"
        options={{
          title: '見る',
          tabBarAccessibilityLabel: '見る：周囲を説明する',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'eye', android: 'visibility', web: 'visibility' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: '盲道',
          tabBarAccessibilityLabel: '盲道：点字ブロックマップ',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'map', android: 'map', web: 'map' }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
