import React from 'react';
import { SafeAreaView as RNSafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../lib/utils/constants';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
}

export function SafeAreaView({ children, style }: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <RNSafeAreaView style={[styles.container, { paddingTop: insets.top }, style]}>
      {children}
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});



