import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NoteProvider } from './src/context/NoteContext';
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import NoteEditorScreen from './src/screens/NoteEditorScreen';
import SearchScreen from './src/screens/SearchScreen';

const Stack = createNativeStackNavigator();

const HEADER_THEME = {
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#ffffff',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerBackTitleVisible: false,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NoteProvider>
        <StatusBar style="light" backgroundColor="#1a1a2e" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={HEADER_THEME}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: '📒 記事本' }}
            />
            <Stack.Screen
              name="Category"
              component={CategoryScreen}
              options={{ title: '分類' }}
            />
            <Stack.Screen
              name="NoteEditor"
              component={NoteEditorScreen}
              options={{ title: '筆記' }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: '🔍 搜尋筆記' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NoteProvider>
    </SafeAreaProvider>
  );
}
