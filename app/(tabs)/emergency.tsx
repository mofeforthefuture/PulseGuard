import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Typography } from '../../src/components/ui/Typography';
import {
  LocationMapView,
  LocationCard,
  AddLocationCircleModal,
  EditLocationCircleModal,
} from '../../src/components/location';
import { EmergencySOSScreen } from '../../src/components/emergency';
import { EmergencySOSFlow } from '../../src/components/emergency/EmergencySOSFlow';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/lib/design/tokens';
import { LocationCircleWithContacts } from '../../src/types/location';
import { useAuth } from '../../src/context/AuthContext';
import { createStaggeredEntrance } from '../../src/lib/animations/utils';
import { getPrimaryHospital } from '../../src/lib/services/hospitalService';
import type { Hospital } from '../../src/types/care';

const MAP_HEIGHT = Dimensions.get('window').height * 0.4;

export default function EmergencyScreen() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [showSOSScreen, setShowSOSScreen] = useState(false);
  const [locationCircles, setLocationCircles] = useState<LocationCircleWithContacts[]>([]);
  const [activeCircleId, setActiveCircleId] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCircle, setEditingCircle] = useState<LocationCircleWithContacts | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [primaryHospital, setPrimaryHospital] = useState<Hospital | null>(null);
  const locationCardAnims = useRef<Animated.Value[]>([]).current;

  // Initialize animations for location cards
  useEffect(() => {
    // Create animation values for each location card
    while (locationCardAnims.length < locationCircles.length) {
      locationCardAnims.push(new Animated.Value(0));
    }
    // Trim if location circles list shrinks
    if (locationCardAnims.length > locationCircles.length) {
      locationCardAnims.splice(locationCircles.length);
    }
    
    // Start staggered entrance animations
    if (locationCircles.length > 0) {
      const animations = createStaggeredEntrance(locationCardAnims.slice(0, locationCircles.length), 60);
      animations.forEach(anim => anim.start());
    }
  }, [locationCircles.length, locationCardAnims]);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  // Load location circles (mock data for now - replace with actual API call)
  useEffect(() => {
    // TODO: Replace with actual Supabase query
    // For now, using mock data
    const mockCircles: LocationCircleWithContacts[] = [
      {
        id: '1',
        user_id: user?.id || '',
        name: 'Home',
        description: 'My apartment',
        latitude: userLocation?.latitude || 37.78825,
        longitude: userLocation?.longitude || -122.4324,
        radius: 100,
        icon: '🏠',
        is_active: true,
        contacts: [
          {
            id: 'c1',
            location_circle_id: '1',
            contact_name: 'Mom',
            contact_phone: '+1234567890',
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setLocationCircles(mockCircles);
  }, [user, userLocation]);

  // Load primary hospital
  useEffect(() => {
    const loadPrimaryHospital = async () => {
      if (user?.id) {
        const hospital = await getPrimaryHospital(user.id);
        setPrimaryHospital(hospital);
      }
    };
    loadPrimaryHospital();
  }, [user?.id]);

  const handlePanicButton = () => {
    // One-tap activation - show countdown immediately
    setShowCountdown(true);
  };

  const handleCountdownComplete = () => {
    // After countdown, show the full SOS screen
    setShowCountdown(false);
    setShowSOSScreen(true);
    setIsActive(true);
  };

  const handleCountdownCancel = () => {
    setShowCountdown(false);
  };

  // Get emergency contacts from user profile and location circles
  const getEmergencyContacts = () => {
    const contacts: Array<{ id: string; name: string; phone: string; relationship?: string }> = [];

    // Add primary emergency contact from profile
    if (user?.emergency_contact_name && user?.emergency_contact_phone) {
      contacts.push({
        id: 'profile-contact',
        name: user.emergency_contact_name,
        phone: user.emergency_contact_phone,
        relationship: 'Emergency Contact',
      });
    }

    // Add contacts from active location circle
    const activeCircle = locationCircles.find((circle) => circle.id === activeCircleId);
    if (activeCircle?.contacts) {
      activeCircle.contacts.forEach((contact) => {
        contacts.push({
          id: contact.id,
          name: contact.contact_name,
          phone: contact.contact_phone,
          relationship: 'Location Circle Contact',
        });
      });
    }

    return contacts;
  };

  const handleAddCircle = (circleData: Omit<LocationCircleWithContacts, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'contacts'>) => {
    // TODO: Save to Supabase
    const newCircle: LocationCircleWithContacts = {
      ...circleData,
      id: Date.now().toString(),
      user_id: user?.id || '',
      contacts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocationCircles([...locationCircles, newCircle]);
  };

  const handleEditCircle = (circleData: Partial<LocationCircleWithContacts>) => {
    // TODO: Update in Supabase
    setLocationCircles(
      locationCircles.map((circle) =>
        circle.id === circleData.id ? { ...circle, ...circleData } : circle
      )
    );
    setEditingCircle(null);
  };

  const handleDeleteCircle = (circleId: string) => {
    // TODO: Delete from Supabase
    setLocationCircles(locationCircles.filter((circle) => circle.id !== circleId));
  };

  const handleCirclePress = (circle: LocationCircleWithContacts) => {
    setActiveCircleId(circle.id === activeCircleId ? undefined : circle.id);
  };

  // Show countdown flow first
  if (showCountdown) {
    return (
      <EmergencySOSFlow
        onCancel={handleCountdownCancel}
        onActivate={handleCountdownComplete}
        userLocation={userLocation || undefined}
        primaryHospital={primaryHospital}
      />
    );
  }

  // Show SOS screen if activated (after countdown)
  if (showSOSScreen) {
    const activeCircle = locationCircles.find((circle) => circle.id === activeCircleId);
    return (
      <EmergencySOSScreen
        onCancel={() => {
          setShowSOSScreen(false);
          setIsActive(false);
        }}
        emergencyContacts={getEmergencyContacts()}
        activeLocationCircle={activeCircle}
        userLocation={userLocation || undefined}
        userId={user?.id}
      />
    );
  }

  return (
    <SafeAreaView>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h1" color="text" weight="bold">
            Emergency
          </Typography>
        </View>

        {/* Panic Button - Large, Red, Centered */}
        <View style={styles.panicContainer}>
          <TouchableOpacity
            onPress={handlePanicButton}
            activeOpacity={0.8}
            style={styles.panicButtonContainer}
            accessibilityRole="button"
            accessibilityLabel="Emergency Panic Button"
            accessibilityHint="Double tap to activate emergency SOS"
          >
            <View style={styles.panicButton}>
              <Typography variant="display" color="text" weight="bold" style={styles.panicButtonText}>
                SOS
              </Typography>
              <Typography variant="body" color="text" style={styles.panicButtonSubtext}>
                Tap to activate
              </Typography>
            </View>
          </TouchableOpacity>
        </View>

        {/* Location Circles Section */}
        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Typography variant="h2" color="text" weight="semibold">
              Location Circles 🎯
            </Typography>
            <Typography variant="bodySmall" color="textSecondary" style={styles.sectionSubtitle}>
              Safe zones that alert your contacts
            </Typography>
          </View>

          {/* Map View */}
          {locationCircles.length > 0 && (
            <View style={styles.mapContainer}>
              <LocationMapView
                locationCircles={locationCircles}
                activeCircleId={activeCircleId}
                onCirclePress={handleCirclePress}
                userLocation={userLocation || undefined}
                initialRegion={
                  userLocation
                    ? {
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }
                    : undefined
                }
              />
            </View>
          )}

          {/* Location Cards */}
          <View style={styles.cardsContainer}>
            {locationCircles.length === 0 ? (
              <Card variant="gradient" padding="lg" style={styles.emptyCard}>
                <Typography variant="h3" color="text" style={styles.emptyTitle}>
                  No Location Circles Yet
                </Typography>
                <Typography variant="body" color="textSecondary" style={styles.emptyDescription}>
                  Create your first location circle to set up safe zones that alert your emergency
                  contacts when you're nearby.
                </Typography>
                <Button
                  title="Create Your First Circle ✨"
                  onPress={() => setShowAddModal(true)}
                  variant="primary"
                  style={styles.emptyButton}
                />
              </Card>
            ) : (
              <>
                {locationCircles.map((circle, index) => {
                  const anim = locationCardAnims[index] || new Animated.Value(1);
                  return (
                    <Animated.View
                      key={circle.id}
                      style={{
                        opacity: anim,
                        transform: [
                          {
                            translateY: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <LocationCard
                        locationCircle={circle}
                        isActive={circle.id === activeCircleId}
                        onPress={() => handleCirclePress(circle)}
                        onEdit={() => setEditingCircle(circle)}
                      />
                    </Animated.View>
                  );
                })}
                <Button
                  title="Add Location Circle ➕"
                  onPress={() => setShowAddModal(true)}
                  variant="outline"
                  style={styles.addButton}
                />
              </>
            )}
          </View>
        </View>

        {/* Emergency SMS Card */}
        <Card variant="reminder" padding="lg" style={styles.smsCard}>
          <Typography variant="h3" color="text" style={styles.cardTitle}>
            Emergency SMS 📱
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.cardSubtitle}>
            Send a pre-configured emergency message to your contacts
          </Typography>
          <Button
            title="Send SMS"
            onPress={() => {
              // TODO: Generate and send SMS
              Alert.alert('SMS', 'Emergency SMS functionality coming soon!');
            }}
            variant="primary"
            style={styles.cardButton}
          />
        </Card>
      </ScrollView>

      {/* Add Location Circle Modal */}
      <AddLocationCircleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCircle}
        initialLocation={userLocation || undefined}
      />

      {/* Edit Location Circle Modal */}
      {editingCircle && (
        <EditLocationCircleModal
          visible={!!editingCircle}
          onClose={() => setEditingCircle(null)}
          onSave={handleEditCircle}
          onDelete={() => editingCircle && handleDeleteCircle(editingCircle.id)}
          locationCircle={editingCircle}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  panicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    minHeight: 220,
  },
  panicButtonContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    ...Platform.select({
      ios: {
        ...Shadows.xl,
        shadowColor: Colors.emergency,
        shadowOpacity: 0.5,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  panicButton: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: Colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  panicButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Spacing.xs,
  },
  panicButtonSubtext: {
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontSize: 14,
  },
  locationSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    marginTop: Spacing.xs,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  cardsContainer: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    marginTop: Spacing.md,
  },
  addButton: {
    marginTop: Spacing.sm,
  },
  smsCard: {
    marginTop: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
});
