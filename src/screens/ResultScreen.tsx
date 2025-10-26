import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ResultScreen({ route }: any) {
  const { emotion, confidence } = route.params || {};
  return (
    <View style={[styles.container]}>
      <Text style={styles.title}>Result</Text>
      <Text style={styles.emotion}>{emotion}</Text>
      <Text style={styles.confidence}>
        {Math.round(confidence * 100)}% confidence
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  emotion: { color: colors.white, fontSize: 42, marginTop: 20 },
  confidence: { color: colors.textSecondary, marginTop: 12 },
});
