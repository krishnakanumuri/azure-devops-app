import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectsScreen from '../screens/ProjectsScreen';
import PipelinesScreen from '../screens/PipelinesScreen';
import RunsScreen from '../screens/RunsScreen';
import RunDetailsScreen from '../screens/RunDetailsScreen';
import LogViewerScreen from '../screens/LogViewerScreen';
import QueueRunScreen from '../screens/QueueRunScreen';
import BuildResolverScreen from '../screens/BuildResolverScreen';
import type { MainStackParamList } from '../types/navigation';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Projects' }} />
      <Stack.Screen name="Pipelines" component={PipelinesScreen} options={{ title: 'Pipelines' }} />
      <Stack.Screen name="Runs" component={RunsScreen} options={{ title: 'Runs' }} />
      <Stack.Screen name="RunDetails" component={RunDetailsScreen} options={{ title: 'Run Details' }} />
      <Stack.Screen name="LogViewer" component={LogViewerScreen} options={{ title: 'Log' }} />
      <Stack.Screen name="QueueRun" component={QueueRunScreen} options={{ title: 'Queue Run' }} />
      <Stack.Screen name="BuildResolver" component={BuildResolverScreen} options={{ title: 'Opening Run…' }} />
    </Stack.Navigator>
  );
}
