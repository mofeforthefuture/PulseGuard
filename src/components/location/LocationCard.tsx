import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationCircleWithContacts } from '../../types/location';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
  Animation,
} from '../../lib/design/tokens';
import { Typography as TypographyComponent } from '../ui/Typography';

interface LocationCardProps {
  locationCircle: LocationCircleWithContacts;
  isActive?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
}

export function LocationCard({
  locationCircle,
  isActive = false,
  onPress,
  onEdit,
}: LocationCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        ...Animation.spring,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...Animation.spring,
      }).start();
    }
  };

  const getGradient = (): [string, string] => {
    if (locationCircle.color) {
      // Create gradient from color
      const baseColor = locationCircle.color;
      return [baseColor, baseColor + 'CC'];
    }
    if (isActive) {
      return [Gradients.primary.start, Gradients.primary.end];
    }
    return [Gradients.surface.start, Gradients.surface.end];
  };

  const getIcon = (): string => {
    if (locationCircle.icon) {
      return locationCircle.icon;
    }
    // Default icons based on name
    const name = locationCircle.name.toLowerCase();
    if (name.includes('home')) return '🏠';
    if (name.includes('work')) return '💼';
    if (name.includes('school')) return '🎓';
    if (name.includes('gym')) return '💪';
    return '📍';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.container}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            isActive && styles.cardActive,
          ]}
        >
        {/* Active glow effect */}
        {isActive && (
          <View style={styles.glowOverlay} />
        )}

        <View style={styles.content}>
          {/* Header with icon and name */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Text style={styles.icon}>{getIcon()}</Text>
            </View>
            <View style={styles.headerText}>
              <TypographyComponent
                variant="h3"
                color="text"
                weight="semibold"
                style={styles.name}
              >
                {locationCircle.name}
              </TypographyComponent>
              {locationCircle.description && (
                <TypographyComponent
                  variant="bodySmall"
                  color="textSecondary"
                  style={styles.description}
                >
                  {locationCircle.description}
                </TypographyComponent>
              )}
            </View>
            {onEdit && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={styles.editButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Contact avatars */}
          {locationCircle.contacts && locationCircle.contacts.length > 0 && (
            <View style={styles.contactsContainer}>
              <TypographyComponent
                variant="caption"
                color="textSecondary"
                style={styles.contactsLabel}
              >
                Contacts
              </TypographyComponent>
              <View style={styles.avatarsContainer}>
                {locationCircle.contacts.slice(0, 4).map((contact, index) => (
                  <View
                    key={contact.id || index}
                    style={[
                      styles.avatar,
                      index > 0 && styles.avatarOverlap,
                      { zIndex: locationCircle.contacts!.length - index },
                    ]}
                  >
                    {contact.avatar_url ? (
                      <View style={styles.avatarImage}>
                        {/* Would use Image component here */}
                        <Text style={styles.avatarFallback}>
                          {contact.contact_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[Gradients.primary.start, Gradients.primary.end]}
                        style={styles.avatarGradient}
                      >
                        <Text style={styles.avatarFallback}>
                          {contact.contact_name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                ))}
                {locationCircle.contacts.length > 4 && (
                  <View style={[styles.avatar, styles.avatarMore]}>
                    <Text style={styles.avatarMoreText}>
                      +{locationCircle.contacts.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Radius indicator */}
          <View style={styles.footer}>
            <View style={styles.radiusIndicator}>
              <Text style={styles.radiusIcon}>⭕</Text>
              <TypographyComponent
                variant="caption"
                color="textSecondary"
                style={styles.radiusText}
              >
                {locationCircle.radius}m radius
              </TypographyComponent>
            </View>
            {isActive && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <TypographyComponent
                  variant="caption"
                  color="text"
                  weight="medium"
                  style={styles.activeText}
                >
                  Active
                </TypographyComponent>
              </View>
            )}
          </View>
        </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardActive: {
    ...Platform.select({
      ios: {
        ...Shadows.lg,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.xl,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainerActive: {
    backgroundColor: Colors.surface,
    transform: [{ scale: 1.1 }],
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginTop: 2,
  },
  editButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface + '60',
  },
  editIcon: {
    fontSize: 18,
  },
  contactsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
  },
  contactsLabel: {
    marginBottom: Spacing.sm,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.surface,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  avatarFallback: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  avatarMore: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.border,
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
  },
  radiusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusIcon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  radiusText: {
    fontSize: 12,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface + '80',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  activeText: {
    fontSize: 11,
  },
});
