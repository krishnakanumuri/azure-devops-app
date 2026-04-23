import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { TimelineRecord } from '../types/devops';
import { useRunDetails } from '../hooks/useRunDetails';
import StatusBadge from '../components/StatusBadge';
import TimelineItem from '../components/TimelineItem';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'RunDetails'>;
type TabKey = 'timeline' | 'errors';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function RunDetailsScreen({ navigation, route }: Props) {
  const { projectName, pipelineId, runId, runName } = route.params;
  const { run, timeline, loading, error, fetch } = useRunDetails(projectName, pipelineId, runId);
  const [tab, setTab] = useState<TabKey>('timeline');
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 500;

  useEffect(() => {
    navigation.setOptions({ title: runName ?? 'Run Details' });
    fetch();
  }, [fetch, navigation, runName]);

  if (loading && !run) return <LoadingOverlay />;

  const records = timeline?.records ?? [];

  const childrenOf = (parentId?: string) =>
    records
      .filter(r => (parentId ? r.parentId === parentId : !r.parentId))
      .sort((a, b) => a.order - b.order);

  const renderTimelineRecord = (record: TimelineRecord, indent = 0): React.ReactNode => {
    const childRecords = childrenOf(record.id);

    return (
      <TimelineItem
        key={record.id}
        record={record}
        indent={isSmallScreen ? 0 : indent}
        onPressLog={record.log ? () => navigateToLog(record) : undefined}>
        {childRecords.map(child => renderTimelineRecord(child, isSmallScreen ? 0 : indent + 1))}
      </TimelineItem>
    );
  };

  const rootRecords = childrenOf();

  const failedRecords = records.filter(
    r => r.result === 'failed' || r.errorCount > 0,
  );

  const navigateToLog = (record: TimelineRecord) => {
    if (record.log) {
      navigation.navigate('LogViewer', {
        projectName,
        buildId: runId,
        logId: record.log.id,
        taskName: record.displayName ?? record.name,
      });
    }
  };

  const effectiveStatus = run
    ? run.state === 'completed'
      ? run.result ?? 'unknown'
      : run.state
    : 'unknown';

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}

      {run && (
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.runName}>{run.name}</Text>
            <StatusBadge status={effectiveStatus} />
          </View>
          <Text style={styles.meta}>
            {run.resources?.repositories?.self?.refName?.replace('refs/heads/', '') ?? ''}
          </Text>
          {run.requestedFor?.displayName ? (
            <Text style={styles.meta}>👤 {run.requestedFor.displayName}</Text>
          ) : null}
          <Text style={styles.meta}>Started: {formatDate(run.createdDate)}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                navigation.navigate('QueueRun', {
                  projectName,
                  pipelineId,
                  pipelineName: run.pipeline.name,
                  existingRun: {
                    runId: run.id,
                    branch: run.resources?.repositories?.self?.refName?.replace('refs/heads/', ''),
                    variables: Object.fromEntries(
                      Object.entries(run.variables ?? {}).map(([k, v]) => [k, v.value]),
                    ),
                  },
                })
              }>
              <Text style={styles.actionBtnText}>
                {run.state === 'completed' ? '↺ Retry Run' : '+ Queue New Run'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['timeline', 'errors'] as TabKey[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'errors' ? `Errors (${failedRecords.length})` : 'Timeline'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.flex}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} />}>
        {tab === 'timeline' &&
          rootRecords.map(record => renderTimelineRecord(record))}

        {tab === 'errors' && (
          failedRecords.length === 0 ? (
            <Text style={styles.empty}>No errors recorded.</Text>
          ) : (
            failedRecords.map(r => (
              <TimelineItem
                key={r.id}
                record={r}
                indent={0}
                onPressLog={r.log ? () => navigateToLog(r) : undefined}
              />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  runName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actionRow: { marginTop: SPACING.sm },
  actionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textMuted },
});
