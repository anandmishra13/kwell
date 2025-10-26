import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './rootStack';

export default function Navigation() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );

}
