import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
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
import { AddLocationCircleModal, LOCATION_ICONS, RADIUS_OPTIONS } from './AddLocationCircleModal';

interface EditLocationCircleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (circle: Partial<LocationCircle>) => void;
  onDelete?: () => void;
  locationCircle: LocationCircle;
}

export function EditLocationCircleModal({
  visible,
  onClose,
  onSave,
  onDelete,
  locationCircle,
}: EditLocationCircleModalProps) {
  const [name, setName] = useState(locationCircle.name);
  const [description, setDescription] = useState(locationCircle.description || '');
  const [selectedIcon, setSelectedIcon] = useState(locationCircle.icon || LOCATION_ICONS[0].emoji);
  const [selectedRadius, setSelectedRadius] = useState(locationCircle.radius);
  const [location, setLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: locationCircle.latitude,
    longitude: locationCircle.longitude,
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Reset form when locationCircle changes
    setName(locationCircle.name);
    setDescription(locationCircle.description || '');
    setSelectedIcon(locationCircle.icon || LOCATION_ICONS[0].emoji);
    setSelectedRadius(locationCircle.radius);
    setLocation({
      latitude: locationCircle.latitude,
      longitude: locationCircle.longitude,
    });
  }, [locationCircle]);

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

    onSave({
      id: locationCircle.id,
      name: name.trim(),
      description: description.trim() || undefined,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: selectedRadius,
      icon: selectedIcon,
    });

    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Location Circle',
      `Are you sure you want to delete "${locationCircle.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.();
            onClose();
          },
        },
      ]
    );
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

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
                      Edit Location Circle ✏️
                    </TypographyComponent>
                    <TypographyComponent
                      variant="bodySmall"
                      color="textSecondary"
                      style={styles.subtitle}
                    >
                      Update your safe zone settings
                    </TypographyComponent>
                  </View>

                  {/* Name Input */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      Name 🏷️
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

                  {/* Description Input */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="textSecondary"
                      style={styles.inputLabel}
                    >
                      Description (optional) 📝
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

                  {/* Icon Selection */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      Icon 🎨
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

                  {/* Radius Selection */}
                  <Card variant="gradient" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      Radius 📏
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
                  <Card variant="calm" padding="md" style={styles.inputCard}>
                    <TypographyComponent
                      variant="label"
                      color="text"
                      style={styles.inputLabel}
                    >
                      Location 📍
                    </TypographyComponent>
                    <View style={styles.locationSet}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <View style={styles.locationInfo}>
                        <TypographyComponent
                          variant="bodySmall"
                          color="text"
                          weight="medium"
                        >
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </TypographyComponent>
                      </View>
                      <Button
                        title="Update"
                        onPress={handleGetCurrentLocation}
                        variant="outline"
                        size="sm"
                        loading={isGettingLocation}
                      />
                    </View>
                  </Card>

                  {/* Actions */}
                  <View style={styles.actions}>
                    {onDelete && (
                      <Button
                        title="Delete"
                        onPress={handleDelete}
                        variant="emergency"
                        style={styles.actionButton}
                      />
                    )}
                    <Button
                      title="Cancel"
                      onPress={onClose}
                      variant="outline"
                      style={styles.actionButton}
                    />
                    <Button
                      title="Save Changes ✨"
                      onPress={handleSave}
                      variant="primary"
                      disabled={!name.trim()}
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
});
