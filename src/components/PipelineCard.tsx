import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Pipeline } from '../types/devops';
import { COLORS, SPACING } from '../theme';

interface Props {
  pipeline: Pipeline;
  onRuns: () => void;
  onQueue: () => void;
}

export default function PipelineCard({ pipeline, onRuns, onQueue }: Props) {
  const folder = pipeline.folder && pipeline.folder !== '\\' ? pipeline.folder.replace(/\\/g, ' / ') : null;
  return (
    <TouchableOpacity style={styles.card} onPress={onRuns} activeOpacity={0.8}>
      <View style={styles.info}>
        {folder && <Text style={styles.folder}>{folder}</Text>}
        <Text style={styles.name}>{pipeline.name}</Text>
        <Text style={styles.id}>ID {pipeline.id}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={onRuns}>
          <Text style={styles.btnText}>Runs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onQueue}>
          <Text style={[styles.btnText, styles.btnPrimaryText]}>Queue</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  info: { flex: 1 },
  folder: { fontSize: 11, color: COLORS.textMuted },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  id: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  btnPrimaryText: { color: '#fff' },
});
