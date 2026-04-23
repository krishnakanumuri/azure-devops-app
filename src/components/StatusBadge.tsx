import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RunState, RunResult, TimelineRecordState, TimelineRecordResult } from '../types/devops';
import { COLORS } from '../theme';

type AnyStatus = RunState | RunResult | TimelineRecordState | TimelineRecordResult | string;

function resolveColor(status: AnyStatus): string {
  if (!status) return COLORS.textMuted;
  switch (status) {
    case 'succeeded': return COLORS.success;
    case 'failed': return COLORS.error;
    case 'canceled':
    case 'canceling':
    case 'skipped':
    case 'abandoned': return COLORS.canceled;
    case 'inProgress':
    case 'running': return COLORS.running;
    case 'queued':
    case 'waiting': return COLORS.queued;
    case 'succeededWithIssues': return COLORS.warning;
    case 'pending': return COLORS.textMuted;
    default: return COLORS.textMuted;
  }
}

function resolveLabel(status: AnyStatus): string {
  if (!status) return 'Unknown';
  switch (status) {
    case 'inProgress': return 'In Progress';
    case 'succeededWithIssues': return 'Warnings';
    case 'canceling': return 'Canceling';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

interface Props {
  status: AnyStatus;
  small?: boolean;
}

export default function StatusBadge({ status, small }: Props) {
  const color = resolveColor(status);
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }, small && styles.small]}>
      <Text style={[styles.text, { color }, small && styles.smallText]}>
        {resolveLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 6, paddingVertical: 1 },
  text: { fontSize: 12, fontWeight: '600' },
  smallText: { fontSize: 10 },
});
