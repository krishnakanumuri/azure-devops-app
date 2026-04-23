import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

interface Props {
  line: string;
  searchTerm?: string;
  isCurrentMatch?: boolean;
}

const ERROR_PREFIXES = ['##[error]', '##[section]error', 'error :'];

function isErrorLine(line: string): boolean {
  const lower = line.toLowerCase();
  return ERROR_PREFIXES.some(p => lower.startsWith(p));
}

function isWarningLine(line: string): boolean {
  return line.toLowerCase().startsWith('##[warning]');
}

/**
 * Splits `line` into an array of Text spans, with all occurrences of `searchTerm`
 * highlighted. `isCurrentMatch` uses a brighter accent for the focused result.
 */
function renderHighlighted(
  line: string,
  searchTerm: string,
  isCurrentMatch: boolean,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const lowerLine = line.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  let lastIndex = 0;
  let key = 0;

  for (
    let idx = lowerLine.indexOf(lowerTerm, lastIndex);
    idx !== -1;
    idx = lowerLine.indexOf(lowerTerm, lastIndex)
  ) {
    if (idx > lastIndex) {
      parts.push(<Text key={key++}>{line.slice(lastIndex, idx)}</Text>);
    }
    parts.push(
      <Text
        key={key++}
        style={isCurrentMatch ? styles.currentMatch : styles.matchHighlight}>
        {line.slice(idx, idx + searchTerm.length)}
      </Text>,
    );
    lastIndex = idx + searchTerm.length;
  }

  if (lastIndex < line.length) {
    parts.push(<Text key={key++}>{line.slice(lastIndex)}</Text>);
  }

  return parts;
}

const LogLine = memo(({ line, searchTerm, isCurrentMatch }: Props) => {
  const isError = isErrorLine(line);
  const isWarn = !isError && isWarningLine(line);
  const lineStyle = [styles.line, isError && styles.error, isWarn && styles.warning];

  return (
    <Text style={lineStyle}>
      {searchTerm
        ? renderHighlighted(line, searchTerm, isCurrentMatch ?? false)
        : line}
    </Text>
  );
});

LogLine.displayName = 'LogLine';
export default LogLine;

const styles = StyleSheet.create({
  line: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: '#d4d4d4',
    lineHeight: 18,
  },
  error: { color: COLORS.error, backgroundColor: '#fde7e9' },
  warning: { color: COLORS.warning, backgroundColor: '#fff4ce' },
  // Yellow highlight — readable on both dark log lines and light error/warning lines
  matchHighlight: { backgroundColor: '#ffd700', color: '#1e1e1e' },
  // Orange accent for the focused (current) match
  currentMatch: { backgroundColor: '#ff9500', color: '#ffffff' },
});
