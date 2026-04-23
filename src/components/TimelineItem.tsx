import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TimelineRecord } from '../types/devops';
import StatusBadge from './StatusBadge';
import { COLORS, SPACING } from '../theme';

interface Props {
  record: TimelineRecord;
  children?: React.ReactNode;
  onPressLog?: () => void;
  indent?: number;
}

function formatDuration(start?: string, end?: string): string {
  if (!start) return '';
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function TimelineItem({ record, children, onPressLog, indent = 0 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = React.Children.count(children) > 0;
  const effectiveStatus =
    record.state === 'completed' ? (record.result ?? 'unknown') : record.state;
  const hasLog = !!record.log;

  return (
    <View style={[styles.container, { marginLeft: indent * 16 }]}>
      <TouchableOpacity
        style={styles.row}
        onPress={hasChildren ? () => setExpanded(e => !e) : undefined}
        activeOpacity={hasChildren ? 0.6 : 1}>
        {hasChildren && (
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {record.displayName ?? record.name}
          </Text>
          <Text style={styles.meta}>
            {formatDuration(record.startTime, record.finishTime)}
            {record.errorCount > 0 ? `  ⛔ ${record.errorCount} error(s)` : ''}
          </Text>
        </View>
        <StatusBadge status={effectiveStatus} small />
        {hasLog && (
          <TouchableOpacity style={styles.logBtn} onPress={onPressLog}>
            <Text style={styles.logBtnText}>Log</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  chevron: { fontSize: 12, color: COLORS.textSecondary, width: 14 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  logBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logBtnText: { fontSize: 11, color: COLORS.primary },
});
