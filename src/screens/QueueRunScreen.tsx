import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { queueRun, getTimeline, getPipelineRunDetails, getBuildDefinition } from '../api';
import ErrorBanner from '../components/ErrorBanner';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'QueueRun'>;

interface VarEntry { key: string; value: string }

export default function QueueRunScreen({ navigation, route }: Props) {
  const { projectName, pipelineId, pipelineName, existingRun } = route.params;

  const [branch, setBranch] = useState(existingRun?.branch ?? 'main');
  const [variables, setVariables] = useState<VarEntry[]>([]);
  const [templateParams, setTemplateParams] = useState<VarEntry[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [skipStages, setSkipStages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: pipelineName ? `Queue: ${pipelineName}` : 'Queue Run' });
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // All fetches are independent — failure of one doesn't block others
      const [def, timeline, runDetails] = await Promise.all([
        getBuildDefinition(projectName, pipelineId).catch(() => null),
        existingRun?.runId ? getTimeline(projectName, existingRun.runId).catch(() => null) : null,
        existingRun?.runId ? getPipelineRunDetails(projectName, pipelineId, existingRun.runId).catch(() => null) : null,
      ]);

      // Build definition variables (allowOverride, non-secret) merged with existing run values
      const defVars: Record<string, string> = {};
      if (def?.variables) {
        for (const [k, v] of Object.entries(def.variables)) {
          if (v.allowOverride && !v.isSecret) defVars[k] = v.value ?? '';
        }
      }
      const merged = { ...defVars, ...(existingRun?.variables ?? {}) };
      setVariables(
        Object.keys(merged).length
          ? Object.entries(merged).map(([key, value]) => ({ key, value }))
          : [{ key: '', value: '' }],
      );

      // Stages from timeline
      if (timeline?.records) {
        const stageNames = timeline.records
          .filter(r => r.type === 'Stage')
          .sort((a, b) => a.order - b.order)
          .map(r => r.displayName ?? r.name);
        setStages(stageNames);
      }

      // Template parameters from Pipelines API run
      if (runDetails?.templateParameters && Object.keys(runDetails.templateParameters).length > 0) {
        setTemplateParams(
          Object.entries(runDetails.templateParameters).map(([key, value]) => ({ key, value })),
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => setVariables(v => [...v, { key: '', value: '' }]);
  const removeVariable = (i: number) => setVariables(v => v.filter((_, idx) => idx !== i));
  const updateVariable = (i: number, field: 'key' | 'value', text: string) =>
    setVariables(v => v.map((entry, idx) => (idx === i ? { ...entry, [field]: text } : entry)));
  const updateTemplateParam = (i: number, value: string) =>
    setTemplateParams(p => p.map((entry, idx) => (idx === i ? { ...entry, value } : entry)));
  const toggleStage = (name: string) =>
    setSkipStages(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const varsMap = Object.fromEntries(
        variables.filter(v => v.key.trim()).map(v => [v.key.trim(), { value: v.value }]),
      );
      const tplMap = Object.fromEntries(templateParams.map(p => [p.key, p.value]));

      const run = await queueRun(projectName, pipelineId, {
        resources: {
          repositories: {
            self: { refName: branch.startsWith('refs/') ? branch : `refs/heads/${branch}` },
          },
        },
        stagesToSkip: Array.from(skipStages),
        variables: Object.keys(varsMap).length ? varsMap : undefined,
        templateParameters: Object.keys(tplMap).length ? tplMap : undefined,
      });

      Alert.alert('Run Queued', `Run ${run.name} has been queued.`, [
        { text: 'View Runs', onPress: () => navigation.navigate('Runs', { projectName, pipelineId, pipelineName }) },
      ]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading pipeline…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error && <ErrorBanner message={error} />}

      <Text style={styles.sectionTitle}>Branch / Tag</Text>
      <TextInput
        style={styles.input}
        value={branch}
        onChangeText={setBranch}
        placeholder="main"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {templateParams.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Parameters</Text>
          {templateParams.map((p, i) => (
            <View key={p.key} style={styles.paramRow}>
              <Text style={styles.paramLabel}>{p.key}</Text>
              <TextInput
                style={[styles.input, styles.paramInput]}
                value={p.value}
                onChangeText={t => updateTemplateParam(i, t)}
                placeholder="value"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Variables</Text>
      {variables.map((v, i) => (
        <View key={i} style={styles.varRow}>
          <TextInput
            style={[styles.input, styles.varInput]}
            value={v.key}
            onChangeText={t => updateVariable(i, 'key', t)}
            placeholder="Name"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.varInput]}
            value={v.value}
            onChangeText={t => updateVariable(i, 'value', t)}
            placeholder="Value"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity onPress={() => removeVariable(i)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addVariable}>
        <Text style={styles.addBtnText}>+ Add Variable</Text>
      </TouchableOpacity>

      {stages.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Stages to Run</Text>
          <Text style={styles.hint}>Uncheck to skip a stage.</Text>
          {stages.map(s => {
            const checked = !skipStages.has(s);
            return (
              <TouchableOpacity key={s} style={styles.checkRow} onPress={() => toggleStage(s)}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.disabled]}
        onPress={handleSubmit}
        disabled={submitting}>
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>▶ Queue Run</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: SPACING.sm, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  paramRow: { marginBottom: SPACING.sm },
  paramLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  paramInput: { marginBottom: 0 },
  varRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: SPACING.sm },
  varInput: { flex: 1, marginBottom: 0 },
  removeBtn: { padding: 4 },
  removeBtnText: { color: COLORS.error, fontSize: 16 },
  addBtn: { marginTop: 4 },
  addBtnText: { color: COLORS.primary, fontSize: 14 },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkLabel: { fontSize: 14, color: COLORS.text },
  submitBtn: { marginTop: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: 8, padding: SPACING.md, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

