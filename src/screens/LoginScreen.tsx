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

export default function LoginScreen() {
  const { login, orgUrl: storedOrgUrl } = useAuthStore();
  const [orgUrl, setOrgUrl] = useState(storedOrgUrl || '');
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            Generate a PAT in Azure DevOps → User Settings → Personal Access Tokens.{'\n'}
            Required scopes: Build (Read &amp; Execute), Project and Team (Read).
          </Text>
        </View>
      </ScrollView>
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
