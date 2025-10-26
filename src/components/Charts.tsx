import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Chart({ data = [60, 40, 80, 20, 50] }: { data?: number[] }) {
  return (
    <View style={styles.row}>
      {data.map((v, i) => (
        <View key={i} style={styles.col}>
          <View style={[styles.bar, { height: v * 1.5 }]} />
          <Text style={styles.label}>Day {i+1}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', width: '100%', paddingHorizontal: 12 },
  col: { alignItems: 'center' },
  bar: { width: 20, backgroundColor: colors.accent, borderRadius: 6 },
  label: { color: colors.white, marginTop: 8, fontSize: 12 }
});