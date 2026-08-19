import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, TabParamList } from './types';
import { font } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import LearnScreen from '../screens/LearnScreen';
import ExamIntroScreen from '../screens/ExamIntroScreen';
import VideosScreen from '../screens/VideosScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubjectScreen from '../screens/SubjectScreen';
import TopicScreen from '../screens/TopicScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResultScreen from '../screens/QuizResultScreen';
import ExamScreen from '../screens/ExamScreen';
import ExamResultScreen from '../screens/ExamResultScreen';
import TutorScreen from '../screens/TutorScreen';
import MathScreen from '../screens/MathScreen';
import MathTopicScreen from '../screens/MathTopicScreen';
import TextbookScreen from '../screens/TextbookScreen';
import TextbookSectionScreen from '../screens/TextbookSectionScreen';
import ModelManagerScreen from '../screens/ModelManagerScreen';
import AboutScreen from '../screens/AboutScreen';
import MarkdownPreviewScreen from '../screens/MarkdownPreviewScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  Home: '◉',
  Learn: '▤',
  ExamTab: '▶',
  Watch: '📺',
  Flashcards: '🗂',
};

function icon(name: keyof TabParamList) {
  // Emoji icons (e.g. Watch's 📺) render in full color and ignore the tab's
  // active/inactive tint, so dim them when the tab isn't focused to read as
  // "inactive" like the monochrome glyph icons.
  const dimWhenInactive = name === 'Watch' || name === 'Flashcards';
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Text style={{ fontSize: 18, color, opacity: dimWhenInactive && !focused ? 0.4 : 1 }}>
      {TAB_ICONS[name]}
    </Text>
  );
}

function Tabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgAlt,
          borderTopColor: colors.border,
          height: 58 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: font.tiny, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarIcon: icon('Home') }} />
      <Tab.Screen name="Learn" component={LearnScreen} options={{ tabBarIcon: icon('Learn') }} />
      <Tab.Screen
        name="ExamTab"
        component={ExamIntroScreen}
        options={{ tabBarIcon: icon('ExamTab'), title: 'Exam' }}
      />
      <Tab.Screen name="Watch" component={VideosScreen} options={{ tabBarIcon: icon('Watch'), title: 'Watch' }} />
      <Tab.Screen name="Flashcards" component={FlashcardsScreen} options={{ tabBarIcon: icon('Flashcards'), title: 'Cards' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgAlt },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Subject" component={SubjectScreen} />
      <Stack.Screen name="Topic" component={TopicScreen} />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={({ route }) => ({ title: route.params.config.title })}
      />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: 'Results', headerBackVisible: false }} />
      <Stack.Screen name="Exam" component={ExamScreen} options={{ title: 'Exam', gestureEnabled: false }} />
      <Stack.Screen
        name="ExamResult"
        component={ExamResultScreen}
        options={{ title: 'Exam results', headerBackVisible: false }}
      />
      <Stack.Screen name="Tutor" component={TutorScreen} options={{ title: 'AI Tutor' }} />
      <Stack.Screen name="Math" component={MathScreen} options={{ title: 'Math & formulas' }} />
      <Stack.Screen name="MathTopic" component={MathTopicScreen} options={{ title: 'Formula' }} />
      <Stack.Screen name="Textbook" component={TextbookScreen} options={{ title: 'Textbook' }} />
      <Stack.Screen
        name="TextbookSection"
        component={TextbookSectionScreen}
        options={{ title: 'Textbook' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="ModelManager" component={ModelManagerScreen} options={{ title: 'AI models' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      {__DEV__ && (
        <Stack.Screen
          name="MarkdownPreview"
          component={MarkdownPreviewScreen}
          options={{ title: 'Markdown preview' }}
        />
      )}
    </Stack.Navigator>
  );
}
