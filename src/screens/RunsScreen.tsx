import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { PipelineRun } from '../types/devops';
import { useRuns } from '../hooks/useRuns';
import RunCard from '../components/RunCard';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Runs'>;

type ListItem =
  | { type: 'header'; label: string; key: string }
  | { type: 'run'; run: PipelineRun; key: string };

export default function RunsScreen({ navigation, route }: Props) {
  const { projectName, pipelineId, pipelineName } = route.params;
  const { runs, loading, error, fetch } = useRuns(projectName, pipelineId);

  useEffect(() => {
    navigation.setOptions({ title: pipelineName ?? 'Runs' });
    fetch();
  }, [fetch, navigation, pipelineName]);

  if (loading && runs.length === 0) return <LoadingOverlay />;

  const active = runs.filter(r => r.state !== 'completed');
  const done = runs.filter(r => r.state === 'completed');

  const items: ListItem[] = [
    ...(active.length > 0 ? [{ type: 'header' as const, label: 'Now Running', key: 'h-active' }] : []),
    ...active.map(r => ({ type: 'run' as const, run: r, key: `r-${r.id}` })),
    ...(done.length > 0 ? [{ type: 'header' as const, label: 'Completed', key: 'h-done' }] : []),
    ...done.map(r => ({ type: 'run' as const, run: r, key: `r-${r.id}` })),
  ];

  const navigateToRun = (item: PipelineRun) =>
    navigation.navigate('RunDetails', {
      projectName,
      pipelineId,
      runId: item.id,
      runName: item.name,
    });

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={[styles.sectionHeader, item.label === 'Now Running' && styles.sectionHeaderActive]}>
                <Text style={[styles.sectionLabel, item.label === 'Now Running' && styles.sectionLabelActive]}>
                  {item.label === 'Now Running' ? '▶ ' : ''}{item.label}
                </Text>
              </View>
            );
          }
          return (
            <RunCard
              run={item.run}
              onPress={() => navigateToRun(item.run)}
            />
          );
        }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No runs found.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  empty: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textMuted },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  sectionHeaderActive: {
    backgroundColor: COLORS.running + '18',
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionLabelActive: { color: COLORS.running },
});
