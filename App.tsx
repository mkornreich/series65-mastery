import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DarkTheme,
  Theme,
} from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { LLMProvider } from './src/llm/LLMProvider';
import { colors } from './src/theme/theme';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgAlt,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <LLMProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </LLMProvider>
    </SafeAreaProvider>
  );
}
