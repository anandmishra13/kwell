import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ProgressCircle({ seconds }: { seconds: number }) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.text}>{seconds}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  circle: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontSize: 42, fontWeight: '700' }
});