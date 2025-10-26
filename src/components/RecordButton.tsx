import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function RecordButton({ onPress, label, disabled }: { onPress: () => void; label?: string; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, disabled && { opacity: 0.7 }]}>
      <Text style={styles.text}>{label || 'Record'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.white, paddingVertical: 14, paddingHorizontal: 34, borderRadius: 40, alignItems: 'center' },
  text: { color: colors.backgroundPrimary, fontWeight: '700', fontSize: 16 }
});