import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { Pipeline } from '../types/devops';
import { usePipelines } from '../hooks/usePipelines';
import PipelineCard from '../components/PipelineCard';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { useRecentPipelinesStore } from '../store';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Pipelines'>;

export default function PipelinesScreen({ navigation, route }: Props) {
  const { projectName } = route.params;
  const { pipelines, loading, error, fetch } = usePipelines(projectName);
  const { addRecentPipeline, getRecent, loadStored } = useRecentPipelinesStore();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: projectName });
    fetch();
    loadStored();
  }, [fetch, navigation, projectName, loadStored]);

  const recentPipelines = getRecent(projectName);

  const handlePipelinePress = useCallback(
    (item: Pipeline) => {
      addRecentPipeline(projectName, item);
      navigation.navigate('Runs', {
        projectName,
        pipelineId: item.id,
        pipelineName: item.name,
      });
    },
    [addRecentPipeline, navigation, projectName],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return pipelines;
    const q = search.toLowerCase();
    return pipelines.filter(p => p.name.toLowerCase().includes(q));
  }, [pipelines, search]);

  const showRecents = searchFocused && search.length === 0 && recentPipelines.length > 0;

  if (loading && pipelines.length === 0) return <LoadingOverlay />;

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          placeholder="Search pipelines…"
          placeholderTextColor={COLORS.textMuted}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {showRecents ? (
        <View style={styles.recentsContainer}>
          <Text style={styles.recentsHeader}>Recently Opened</Text>
          {recentPipelines.map(item => (
            <PipelineCard
              key={item.id}
              pipeline={item}
              onRuns={() => handlePipelinePress(item)}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          refreshControl={
            search.length === 0
              ? <RefreshControl refreshing={loading} onRefresh={fetch} />
              : undefined
          }
          renderItem={({ item }) => (
            <PipelineCard
              pipeline={item}
              onRuns={() => handlePipelinePress(item)}
            />
          )}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>
                {search.length > 0 ? 'No pipelines match your search.' : 'No pipelines found.'}
              </Text>
            ) : null
          }
        />
      )}
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
  recentsContainer: { flex: 1 },
  recentsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  empty: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textMuted },
});
