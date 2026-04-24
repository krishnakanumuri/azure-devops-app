import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { usePipelines } from '../hooks/usePipelines';
import PipelineCard from '../components/PipelineCard';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Pipelines'>;

export default function PipelinesScreen({ navigation, route }: Props) {
  const { projectName } = route.params;
  const { pipelines, loading, error, fetch } = usePipelines(projectName);
  const [search, setSearch] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: projectName });
    fetch();
  }, [fetch, navigation, projectName]);

  const filtered = useMemo(() => {
    if (!search.trim()) return pipelines;
    const q = search.toLowerCase();
    return pipelines.filter(p => p.name.toLowerCase().includes(q));
  }, [pipelines, search]);

  if (loading && pipelines.length === 0) return <LoadingOverlay />;

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search pipelines…"
          placeholderTextColor={COLORS.textMuted}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
        renderItem={({ item }) => (
          <PipelineCard
            pipeline={item}
            onRuns={() =>
              navigation.navigate('Runs', {
                projectName,
                pipelineId: item.id,
                pipelineName: item.name,
              })
            }
          />
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No pipelines found.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { padding: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: 14,
    color: COLORS.text,
  },
  empty: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textMuted },
});
