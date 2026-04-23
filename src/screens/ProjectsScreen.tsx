import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { useProjects } from '../hooks/useProjects';
import { useAuthStore } from '../store';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Projects'>;

export default function ProjectsScreen({ navigation }: Props) {
  const { projects, loading, error, fetch } = useProjects();
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    fetch();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      ),
    });
  }, [fetch, navigation, logout]);

  if (loading && projects.length === 0) return <LoadingOverlay />;

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}
      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('Pipelines', {
                projectName: item.name,
                projectId: item.id,
              })
            }>
            <Text style={styles.name}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No projects found.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
