import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onInfoPress?: () => void;
}

export default function Header({ onInfoPress }: Props) {
  return (
    <View style={styles.header}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <TouchableOpacity onPress={onInfoPress}>
        <Image
          source={require('../assets/icons/info.png')}
          style={styles.infoIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  logo: {
    width: 110,
    height: 36,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});