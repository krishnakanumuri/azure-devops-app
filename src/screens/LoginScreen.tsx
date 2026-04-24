import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store';
import { getProjects } from '../api';
import { COLORS, SPACING } from '../theme';
import HelpDialog from '../components/HelpDialog';

const LOGIN_HELP_SECTIONS = [
  {
    heading: 'Organisation URL',
    body: 'Enter your Azure DevOps organisation URL, e.g.\nhttps://dev.azure.com/yourorg\n\nFor on-premise servers use your TFS collection URL.',
  },
  {
    heading: 'Personal Access Token (PAT)',
    body: 'Generate a PAT in Azure DevOps:\n1. Go to User Settings → Personal Access Tokens\n2. Click "New Token"\n3. Set the following scopes:\n   • Build — Read & Execute\n   • Project and Team — Read\n4. Copy the token and paste it here.',
  },
  {
    heading: 'Security',
    body: 'Your PAT is stored securely on this device and never sent anywhere except your Azure DevOps organisation.',
  },
];

export default function LoginScreen() {
  const { login, orgUrl: storedOrgUrl } = useAuthStore();
  const [orgUrl, setOrgUrl] = useState(storedOrgUrl || '');
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  const handleLogin = async () => {
    if (!orgUrl.trim() || !pat.trim()) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Validate credentials by attempting a real API call before persisting
      await login(orgUrl.trim(), pat.trim());
      await getProjects();
    } catch (e: unknown) {
      // Keep orgUrl in store (expireSession) so it stays pre-filled on retry
      await useAuthStore.getState().expireSession();
      setError(e instanceof Error ? e.message : 'Login failed. Check your URL and PAT.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Azure DevOps</Text>
          <Text style={styles.subtitle}>Pipeline Manager</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formTitleRow}>
            <Text style={styles.formTitle}>Sign In</Text>
            <TouchableOpacity onPress={() => setHelpVisible(true)} hitSlop={8} style={styles.helpBtn}>
              <Text style={styles.helpIcon}>?</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Organisation URL</Text>
          <TextInput
            style={styles.input}
            value={orgUrl}
            onChangeText={setOrgUrl}
            placeholder="https://dev.azure.com/yourorg"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Personal Access Token</Text>
          <TextInput
            style={styles.input}
            value={pat}
            onChangeText={setPat}
            placeholder="Paste your PAT here"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Tap ? above for help generating a PAT.
          </Text>
        </View>
      </ScrollView>

      <HelpDialog
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title="Sign In Help"
        sections={LOGIN_HELP_SECTIONS}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  errorText: { color: COLORS.error, fontSize: 13, marginBottom: SPACING.sm },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    lineHeight: 18,
    textAlign: 'center',
  },
});
