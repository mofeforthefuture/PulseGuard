import React from 'react';
import { SafeAreaView as RNSafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../lib/design/useColors';

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
}

export function SafeAreaView({ children, style }: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <RNSafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }, style]}>
      {children}
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});



