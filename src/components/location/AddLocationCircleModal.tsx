import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Text,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
  Animation,
} from '../../lib/design/tokens';
import { Button } from '../ui/Button';
import { Typography as TypographyComponent } from '../ui/Typography';
import { Card } from '../ui/Card';
import { LocationCircle } from '../../types/location';

interface AddLocationCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (circle: Omit<LocationCircle, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  initialLocation?: { latitude: number; longitude: number };
}

export const LOCATION_ICONS = [
  { emoji: '🏠', label: 'Home' },
  { emoji: '💼', label: 'Work' },
  { emoji: '🎓', label: 'School' },
  { emoji: '💪', label: 'Gym' },
  { emoji: '🏥', label: 'Hospital' },
  { emoji: '🛒', label: 'Store' },
  { emoji: '☕', label: 'Cafe' },
  { emoji: '📍', label: 'Other' },
];

export const RADIUS_OPTIONS = [
  { value: 50, label: 'Small (50m)', emoji: '🔵' },
  { value: 100, label: 'Medium (100m)', emoji: '🟢' },
  { value: 200, label: 'Large (200m)', emoji: '🟡' },
  { value: 500, label: 'Extra Large (500m)', emoji: '🟠' },
];

export function AddLocationCircleModal({
  visible,
  onClose,
  onSave,
  initialLocation,
}: AddLocationCircleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(LOCATION_ICONS[0].emoji);
  const [selectedRadius, setSelectedRadius] = useState(RADIUS_OPTIONS[1].value);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation || null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, slideAnim, scaleAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setIsGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get your location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a name for this location');
      return;
    }
    if (!location) {
      alert('Please set a location');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: selectedRadius,
      icon: selectedIcon,
      is_active: true,
    });

    // Reset form
    setName('');
    setDescription('');
    setSelectedIcon(LOCATION_ICONS[0].emoji);
    setSelectedRadius(RADIUS_OPTIONS[1].value);
    setLocation(initialLocation || null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { translateY },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <LinearGradient
                colors={[Gradients.surface.start, Gradients.surface.end]}
                style={styles.modal}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Header */}
                  <View style={styles.header}>
                    <TypographyComponent variant="h1" color="text" weight="bold">
                      Add Location Circle 🎯
                    </TypographyComponent>
                    <TypographyComponent
                      variant="bodySmall"
                      color="textSecondary"
                      style={styles.subtitle}
                    >
                      Create a safe zone that alerts your contacts
                    </TypographyComponent>
                  </View>

                  {/* Name Input - Playful */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      What should we call this place? 🏷️
                    </TypographyComponent>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Home, Work, Gym..."
                      placeholderTextColor={Colors.textLight}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </Card>

                  {/* Description Input - Optional */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="textSecondary"
                      style={styles.inputLabel}
                    >
                      Add a note (optional) 📝
                    </TypographyComponent>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="e.g., Main entrance, Parking lot..."
                      placeholderTextColor={Colors.textLight}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={2}
                    />
                  </Card>

                  {/* Icon Selection - Playful Grid */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      Pick an icon 🎨
                    </TypographyComponent>
                    <View style={styles.iconGrid}>
                      {LOCATION_ICONS.map((icon) => (
                        <TouchableOpacity
                          key={icon.emoji}
                          onPress={() => setSelectedIcon(icon.emoji)}
                          style={[
                            styles.iconOption,
                            selectedIcon === icon.emoji && styles.iconOptionSelected,
                          ]}
                        >
                          <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                          <TypographyComponent
                            variant="caption"
                            color={selectedIcon === icon.emoji ? 'text' : 'textSecondary'}
                            style={styles.iconLabel}
                          >
                            {icon.label}
                          </TypographyComponent>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Card>

                  {/* Radius Selection - Visual */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      How big should the circle be? 📏
                    </TypographyComponent>
                    <View style={styles.radiusContainer}>
                      {RADIUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setSelectedRadius(option.value)}
                          style={[
                            styles.radiusOption,
                            selectedRadius === option.value && styles.radiusOptionSelected,
                          ]}
                        >
                          <Text style={styles.radiusEmoji}>{option.emoji}</Text>
                          <TypographyComponent
                            variant="bodySmall"
                            color={selectedRadius === option.value ? 'text' : 'textSecondary'}
                            weight={selectedRadius === option.value ? 'semibold' : 'regular'}
                            style={styles.radiusLabel}
                          >
                            {option.label}
                          </TypographyComponent>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Card>

                  {/* Location Selection */}
                  <Card
                    variant={location ? 'calm' : 'reminder'}
                    padding="md"
                    style={styles.inputCard}
                  >
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      Set Location 📍
                    </TypographyComponent>
                    {location ? (
                      <View style={styles.locationSet}>
                        <Text style={styles.locationIcon}>✅</Text>
                        <View style={styles.locationInfo}>
                          <TypographyComponent
                            variant="bodySmall"
                            color="text"
                            weight="medium"
                          >
                            Location Set
                          </TypographyComponent>
                          <TypographyComponent
                            variant="caption"
                            color="textSecondary"
                            style={styles.locationCoords}
                          >
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </TypographyComponent>
                        </View>
                        <Button
                          title="Change"
                          onPress={handleGetCurrentLocation}
                          variant="outline"
                          size="sm"
                        />
                      </View>
                    ) : (
                      <Button
                        title={isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                        onPress={handleGetCurrentLocation}
                        loading={isGettingLocation}
                        variant="primary"
                        style={styles.locationButton}
                      />
                    )}
                  </Card>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <Button
                      title="Cancel"
                      onPress={onClose}
                      variant="outline"
                      style={styles.actionButton}
                    />
                    <Button
                      title="Create Circle ✨"
                      onPress={handleSave}
                      variant="primary"
                      disabled={!name.trim() || !location}
                      style={styles.actionButton}
                    />
                  </View>
                </ScrollView>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    ...Platform.select({
      ios: {
        ...Shadows.xl,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  inputCard: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontFamily: Typography.fontFamily.regular,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  iconOption: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  iconOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  iconEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  iconLabel: {
    fontSize: 10,
  },
  radiusContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radiusOptionSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  radiusEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  radiusLabel: {
    flex: 1,
  },
  locationButton: {
    marginTop: Spacing.sm,
  },
  locationSet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface + '80',
    borderRadius: BorderRadius.lg,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationCoords: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
