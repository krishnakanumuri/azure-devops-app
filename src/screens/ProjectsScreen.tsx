import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { Project } from '../types/devops';
import { useProjects } from '../hooks/useProjects';
import { useAuthStore, useRecentProjectsStore } from '../store';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Projects'>;

export default function ProjectsScreen({ navigation }: Props) {
  const { projects, loading, error, fetch } = useProjects();
  const logout = useAuthStore(s => s.logout);
  const { recentProjects, addRecentProject, loadStored } = useRecentProjectsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetch();
    loadStored();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      ),
    });
  }, [fetch, navigation, logout, loadStored]);

  const handleProjectPress = useCallback(
    (item: Project) => {
      addRecentProject(item);
      navigation.navigate('Pipelines', {
        projectName: item.name,
        projectId: item.id,
      });
    },
    [addRecentProject, navigation],
  );

  const renderProjectCard = useCallback(
    ({ item }: { item: Project }) => (
      <TouchableOpacity style={styles.card} onPress={() => handleProjectPress(item)}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </TouchableOpacity>
    ),
    [handleProjectPress],
  );

  // Decide what to show in the main list
  const showRecents = searchFocused && searchQuery.length === 0 && recentProjects.length > 0;
  const filteredProjects = searchQuery.length > 0
    ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : projects;

  if (loading && projects.length === 0) return <LoadingOverlay />;

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects…"
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {showRecents ? (
        <View style={styles.recentsContainer}>
          <Text style={styles.recentsHeader}>Recently Opened</Text>
          {recentProjects.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handleProjectPress(item)}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={item => item.id}
          refreshControl={
            searchQuery.length === 0
              ? <RefreshControl refreshing={loading} onRefresh={fetch} />
              : undefined
          }
          renderItem={renderProjectCard}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>
                {searchQuery.length > 0 ? 'No projects match your search.' : 'No projects found.'}
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
  },
  recentsContainer: {
    flex: 1,
  },
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  desc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textMuted },
  logoutBtn: { marginRight: SPACING.sm },
  logoutText: { color: COLORS.primary, fontSize: 14 },
});
