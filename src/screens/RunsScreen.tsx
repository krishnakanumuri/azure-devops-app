import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { useRuns } from '../hooks/useRuns';
import RunCard from '../components/RunCard';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Runs'>;

export default function RunsScreen({ navigation, route }: Props) {
  const { projectName, pipelineId, pipelineName } = route.params;
  const { runs, loading, error, fetch } = useRuns(projectName, pipelineId);

  useEffect(() => {
    navigation.setOptions({ title: pipelineName ?? 'Runs' });
    fetch();
  }, [fetch, navigation, pipelineName]);

  if (loading && runs.length === 0) return <LoadingOverlay />;

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}
      <FlatList
        data={runs}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
        renderItem={({ item }) => (
          <RunCard
            run={item}
            onPress={() =>
              navigation.navigate('RunDetails', {
                projectName,
                pipelineId,
                runId: item.id,
                runName: item.name,
              })
            }
            onRetry={() =>
              navigation.navigate('QueueRun', {
                projectName,
                pipelineId,
                pipelineName,
                existingRun: {
                  runId: item.id,
                  branch: item.resources?.repositories?.self?.refName?.replace('refs/heads/', ''),
                  variables: Object.fromEntries(
                    Object.entries(item.variables ?? {}).map(([k, v]) => [k, v.value]),
                  ),
                },
              })
            }
          />
        )}
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
});
