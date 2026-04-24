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
import HelpDialog from '../components/HelpDialog';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Projects'>;

const NAV_HELP_SECTIONS = [
  {
    heading: 'Projects',
    body: 'Lists all projects in your Azure DevOps organisation. Tap a project to browse its pipelines.',
  },
  {
    heading: 'Pipelines',
    body: 'Shows all pipelines for the selected project. Tap a pipeline to view its recent runs. Use the search bar to filter — recently opened pipelines appear when you focus the search.',
  },
  {
    heading: 'Runs',
    body: 'Lists recent pipeline runs. Tap a run to see its timeline with stages, jobs, and tasks.',
  },
  {
    heading: 'Log Viewer',
    body: 'Tap any task in the run timeline to view its full log output.',
  },
];

export default function ProjectsScreen({ navigation }: Props) {
  const { projects, loading, error, fetch } = useProjects();
  const logout = useAuthStore(s => s.logout);
  const { recentProjects, addRecentProject, loadStored } = useRecentProjectsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  useEffect(() => {
    fetch();
    loadStored();
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitleText}>Projects</Text>
          <TouchableOpacity onPress={fetch} style={styles.headerRefreshBtn} hitSlop={8}>
            <Text style={styles.headerRefreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setHelpVisible(true)} hitSlop={8} style={styles.helpBtn}>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
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
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
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

      <HelpDialog
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title="App Help"
        sections={NAV_HELP_SECTIONS}
      />
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitleText: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  headerRefreshBtn: { padding: SPACING.xs },
  headerRefreshIcon: { fontSize: 26, color: COLORS.primary, lineHeight: 30 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginRight: SPACING.sm },
  helpBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17 },
  logoutBtn: {},
  logoutText: { color: COLORS.primary, fontSize: 14 },
});
