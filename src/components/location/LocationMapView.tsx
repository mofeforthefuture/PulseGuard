import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Text,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationCircleWithContacts } from '../../types/location';
import { Colors, Gradients, Spacing, Shadows } from '../../lib/design/tokens';

interface LocationMapViewProps {
  locationCircles: LocationCircleWithContacts[];
  activeCircleId?: string;
  onCirclePress?: (circle: LocationCircleWithContacts) => void;
  userLocation?: { latitude: number; longitude: number };
  initialRegion?: Region;
}

export function LocationMapView({
  locationCircles,
  activeCircleId,
  onCirclePress,
  userLocation,
  initialRegion,
}: LocationMapViewProps) {
  const [mapRegion, setMapRegion] = useState<Region | undefined>(initialRegion);
  const glowAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;

  // Initialize glow animations for each circle
  useEffect(() => {
    locationCircles.forEach((circle) => {
      if (!glowAnimations.has(circle.id)) {
        const anim = new Animated.Value(0);
        glowAnimations.set(circle.id, anim);
      }
    });
  }, [locationCircles, glowAnimations]);

  // Animate active circle glow
  useEffect(() => {
    locationCircles.forEach((circle) => {
      const anim = glowAnimations.get(circle.id);
      if (!anim) return;

      if (circle.id === activeCircleId) {
        // Pulsing glow for active circle
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      } else {
        anim.setValue(0);
      }
    });
  }, [activeCircleId, locationCircles, glowAnimations]);

  const getCircleColor = (circle: LocationCircleWithContacts, isActive: boolean) => {
    if (isActive) {
      return circle.color || Colors.primary;
    }
    return circle.color || Colors.primaryLight;
  };

  const getCircleOpacity = (circle: LocationCircleWithContacts, isActive: boolean) => {
    const anim = glowAnimations.get(circle.id);
    if (isActive && anim) {
      return anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
      });
    }
    return 0.2;
  };

  const defaultRegion: Region = {
    latitude: userLocation?.latitude || 37.78825,
    longitude: userLocation?.longitude || -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={mapRegion || defaultRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="standard"
      >
        {/* Soft overlay gradient */}
        <View style={styles.overlay} pointerEvents="none">
          <LinearGradient
            colors={['transparent', Colors.background + '40', Colors.background + '80']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>

        {/* Location Circles */}
        {locationCircles.map((circle) => {
          const isActive = circle.id === activeCircleId;
          const anim = glowAnimations.get(circle.id);

          return (
            <React.Fragment key={circle.id}>
              {/* Outer glow circle for active */}
              {isActive && anim && (
                <Circle
                  center={{
                    latitude: circle.latitude,
                    longitude: circle.longitude,
                  }}
                  radius={circle.radius * 1.3}
                  fillColor={getCircleColor(circle, true) + '20'}
                  strokeColor={getCircleColor(circle, true) + '40'}
                  strokeWidth={2}
                />
              )}

              {/* Main circle */}
              <Circle
                center={{
                  latitude: circle.latitude,
                  longitude: circle.longitude,
                }}
                radius={circle.radius}
                fillColor={getCircleColor(circle, isActive) + (isActive ? '30' : '20')}
                strokeColor={getCircleColor(circle, isActive)}
                strokeWidth={isActive ? 3 : 2}
                onPress={() => onCirclePress?.(circle)}
              />

              {/* Center marker */}
              <Marker
                coordinate={{
                  latitude: circle.latitude,
                  longitude: circle.longitude,
                }}
                onPress={() => onCirclePress?.(circle)}
                anchor={{ x: 0.5, y: 0.5 }}
                title={circle.name}
                description={circle.contacts?.length ? `${circle.contacts.length} contact${circle.contacts.length > 1 ? 's' : ''}` : undefined}
              >
                <View
                  style={[
                    styles.markerContainer,
                    isActive && styles.markerContainerActive,
                  ]}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        backgroundColor: getCircleColor(circle, isActive),
                      },
                    ]}
                  >
                    {circle.icon ? (
                      <View style={styles.markerIcon}>
                        <Text style={styles.markerIconText}>{circle.icon}</Text>
                      </View>
                    ) : null}
                  </View>
                  {isActive && (
                    <View
                      style={[
                        styles.markerGlow,
                        {
                          backgroundColor: getCircleColor(circle, true),
                        },
                      ]}
                    />
                  )}
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.lg,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  markerContainerActive: {
    width: 50,
    height: 50,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  markerGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.3,
    zIndex: -1,
  },
  markerIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIconText: {
    fontSize: 16,
  },
});
