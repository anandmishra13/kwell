import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
// import { iOSUIKit } from 'react-native-typography';


interface HeaderViewProps {
  title: string;
  subtitle: string;
  onEULAPress: () => void;
  onPrivacyPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');


const HeaderView: React.FC<HeaderViewProps> = ({
  title,
  subtitle,
  onEULAPress,
  onPrivacyPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View>
            <Image
                source={require('../../../../assets/images/logo-w.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
        
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onEULAPress}>
                <Text style={styles.buttonText}>EULA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onPrivacyPress}>
                <Text style={styles.buttonText}>PRIVACY</Text>
            </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.title]}>{title}</Text>
      <Text style={[styles.subtitle]}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  logoContainer: {
    width: '100%',
    marginBottom: 10,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  logo: {
    width: SCREEN_WIDTH * 0.30,
    height: 100,
  },
  buttonContainer: {
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center',
    gap: 5,
    // position: 'absolute',
    // top: 0,
    right: 0,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'gothamMedium'
  },
  title: {
    color: 'white',
    fontFamily: 'Gotham-Bold',
    marginBottom: 4,
    fontSize: 30
  },
  subtitle: {
    color: 'white',
    fontFamily: 'Gotham-Light',
    opacity: 0.8,
    fontSize: 20
  },
});

export default HeaderView;
