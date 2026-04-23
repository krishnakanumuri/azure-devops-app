import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { useLogs } from '../hooks/useLogs';
import LogLine from '../components/LogLine';
import ErrorBanner from '../components/ErrorBanner';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'LogViewer'>;

export default function LogViewerScreen({ navigation, route }: Props) {
  const { projectName, buildId, logId, taskName } = route.params;
  const { lines, loading, error, fetch } = useLogs(projectName, buildId, logId);
  const listRef = useRef<FlatList>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const activeTerm = searchTerm.trim();

  useEffect(() => {
    navigation.setOptions({
      title: taskName ?? 'Log',
      headerRight: () => (
        <TouchableOpacity onPress={handleCopy} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Copy</Text>
        </TouchableOpacity>
      ),
    });
    fetch();
  }, [fetch, navigation, taskName]);

  // Auto-scroll to end when log loads, but only when not searching
  useEffect(() => {
    if (lines.length > 0 && !activeTerm) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [lines, activeTerm]);

  /** Indices (into `lines`) of every line that contains the active search term. */
  const matchLineIndices = useMemo(() => {
    if (!activeTerm) return [];
    const lower = activeTerm.toLowerCase();
    return lines.reduce<number[]>((acc, line, i) => {
      if (line.toLowerCase().includes(lower)) acc.push(i);
      return acc;
    }, []);
  }, [lines, activeTerm]);

  // Reset to first match whenever the search term changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [activeTerm]);

  // Scroll to the current match in the list
  useEffect(() => {
    if (matchLineIndices.length === 0) return;
    const lineIdx = matchLineIndices[currentMatchIndex] ?? 0;
    listRef.current?.scrollToIndex({ index: lineIdx, animated: true, viewPosition: 0.5 });
  }, [currentMatchIndex, matchLineIndices]);

  const goNext = useCallback(() => {
    if (matchLineIndices.length === 0) return;
    setCurrentMatchIndex(i => (i + 1) % matchLineIndices.length);
  }, [matchLineIndices.length]);

  const goPrev = useCallback(() => {
    if (matchLineIndices.length === 0) return;
    setCurrentMatchIndex(i => (i - 1 + matchLineIndices.length) % matchLineIndices.length);
  }, [matchLineIndices.length]);

  const handleCopy = () => {
    const text = lines.join('\n');
    if (Platform.OS === 'web') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)?.navigator?.clipboard?.writeText(text).catch(() => {});
    } else {
      Clipboard.setString(text);
    }
    Share.share({ message: text, title: taskName }).catch(() => {});
  };

  if (loading) return <LoadingOverlay />;

  const hasMatches = matchLineIndices.length > 0;

  return (
    <View style={styles.container}>
      {error && <ErrorBanner message={error} />}

      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs…"
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={goNext}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {activeTerm.length > 0 && (
          <>
            <Text style={styles.matchCount}>
              {hasMatches ? `${currentMatchIndex + 1} / ${matchLineIndices.length}` : '0 / 0'}
            </Text>
            <TouchableOpacity onPress={goPrev} disabled={!hasMatches} style={styles.navBtn}>
              <Text style={[styles.navBtnText, !hasMatches && styles.navBtnDisabled]}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} disabled={!hasMatches} style={styles.navBtn}>
              <Text style={[styles.navBtnText, !hasMatches && styles.navBtnDisabled]}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={lines}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <LogLine
            line={item}
            searchTerm={activeTerm || undefined}
            isCurrentMatch={hasMatches && matchLineIndices[currentMatchIndex] === index}
          />
        )}
        contentContainerStyle={styles.content}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          // Fallback: jump to approximate offset when item is outside rendered window
          listRef.current?.scrollToOffset({
            offset: index * averageItemLength,
            animated: true,
          });
        }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Log is empty.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  searchInput: {
    flex: 1,
    height: 34,
    backgroundColor: '#3d3d3d',
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    color: '#d4d4d4',
    fontSize: 13,
  },
  matchCount: {
    color: '#a0a0a0',
    fontSize: 12,
    marginLeft: SPACING.sm,
    minWidth: 52,
    textAlign: 'center',
  },
  navBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  navBtnText: { color: COLORS.primary, fontSize: 22, lineHeight: 26 },
  navBtnDisabled: { color: '#555' },
  content: { padding: SPACING.sm },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
  headerBtn: { marginRight: SPACING.sm },
  headerBtnText: { color: COLORS.primary, fontSize: 14 },
});
