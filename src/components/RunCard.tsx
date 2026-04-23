import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PipelineRun } from '../types/devops';
import StatusBadge from './StatusBadge';
import { COLORS, SPACING } from '../theme';

interface Props {
  run: PipelineRun;
  onPress: () => void;
  onRetry: () => void;
}

function formatDuration(start?: string, end?: string): string {
  if (!start) return '';
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function RunCard({ run, onPress, onRetry }: Props) {
  const branch = run.resources?.repositories?.self?.refName?.replace('refs/heads/', '') ?? '';
  const triggeredBy = run.requestedFor?.displayName ?? '';
  const effectiveStatus = run.state === 'completed' ? (run.result ?? 'unknown') : run.state;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{run.name}</Text>
        <StatusBadge status={effectiveStatus} small />
      </View>
      {branch ? <Text style={styles.meta}>🌿 {branch}</Text> : null}
      {triggeredBy ? <Text style={styles.meta}>👤 {triggeredBy}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.meta}>{formatDate(run.createdDate)}</Text>
        <Text style={styles.meta}>{formatDuration(run.createdDate, run.finishedDate)}</Text>
      </View>
      {(run.state === 'completed') && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>↺ Retry</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  retryBtn: { alignSelf: 'flex-end', marginTop: 6 },
  retryText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});
