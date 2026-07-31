import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  Theme,
} from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { LLMProvider } from './src/llm/LLMProvider';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

function Root() {
  const { colors, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.bg,
      card: colors.bgAlt,
      primary: colors.primary,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LLMProvider>
          <Root />
        </LLMProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
