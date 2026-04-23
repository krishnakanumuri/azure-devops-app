import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../theme';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠ {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#fde7e9',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  text: {
    color: COLORS.error,
    fontSize: 14,
  },
});
