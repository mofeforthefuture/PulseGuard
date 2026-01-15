import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Platform, Animated, Text } from 'react-native';
import { Spacing, Colors } from '../../lib/design/tokens';

interface ALARAMascotProps {
  size?: number;
  style?: any;
}

const ALARA_ASSETS = {
  image: 'https://assets.masco.dev/2a733c/alara-8022/wave-5d6f4b6e.png',
  transparent_image: 'https://assets.masco.dev/2a733c/alara-8022/wave-101c7c62.png',
};

export function ALARAMascot({
  size = 200,
  style,
}: ALARAMascotProps) {
  const hoverAnim = React.useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState(false);

  // Hovering animation
  useEffect(() => {
    const hoverAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    hoverAnimation.start();

    return () => {
      hoverAnimation.stop();
    };
  }, [hoverAnim]);

  const translateY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8], // Moves 8px up and down
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View
        style={{
          transform: [{ translateY }],
        }}
      >
        {imageError ? (
          <View style={[styles.fallbackContainer, { width: size, height: size }]}>
            <Text style={[styles.fallbackEmoji, { fontSize: size * 0.5 }]}>💜</Text>
            <Text style={styles.fallbackText}>ALARA</Text>
          </View>
        ) : (
          <Image
            source={{ uri: ALARA_ASSETS.transparent_image }}
            style={[styles.image, { width: size, height: size }]}
            resizeMode="contain"
            accessibilityLabel="ALARA mascot"
            onError={() => {
              console.log('Failed to load ALARA image, using fallback');
              setImageError(true);
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.calm,
    borderRadius: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fallbackEmoji: {
    marginBottom: Spacing.xs,
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
