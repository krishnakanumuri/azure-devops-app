import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { getBuildById } from '../api';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBanner from '../components/ErrorBanner';
import { COLORS } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'BuildResolver'>;

export default function BuildResolverScreen({ navigation, route }: Props) {
  const { pcguid, buildId } = route.params;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Opening Run…' });
    let cancelled = false;

    getBuildById(pcguid, buildId)
      .then(build => {
        if (cancelled) return;
        navigation.replace('RunDetails', {
          projectName: build.project.name,
          pipelineId: build.definition.id,
          runId: build.id,
          runName: build.buildNumber,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to resolve build link');
      });

    return () => { cancelled = true; };
  }, [pcguid, buildId, navigation]);

  return (
    <View style={styles.container}>
      {error ? <ErrorBanner message={error} /> : <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
