import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../lib/design/useColors';
import { Spacing, BorderRadius, Shadows, Gradients } from '../../lib/design/tokens';
import { Typography } from '../ui/Typography';
import { PersonalitySelector } from '../ui/PersonalitySelector';
import type { ALARAPersonality } from '../../lib/openrouter/client';
import { createFadeIn } from '../../lib/animations/utils';

interface PersonalitySelectionModalProps {
  visible: boolean;
  currentPersonality?: ALARAPersonality;
  onSelect: (personality: ALARAPersonality) => void;
}

export function PersonalitySelectionModal({ visible, currentPersonality = 'friendly', onSelect }: PersonalitySelectionModalProps) {
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        createFadeIn(fadeAnim),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent closing without selecting - user must choose
      }}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: colors.background + 'E6', // Semi-transparent
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.header, { backgroundColor: colors.primary + '15' }]}>
            <Typography variant="h2" style={styles.headerEmoji}>
              💜
            </Typography>
            <Typography variant="h2" color="text" weight="bold" style={styles.headerTitle}>
              Hey! Before we chat...
            </Typography>
          </View>

          <View style={styles.content}>
            <Typography variant="body" color="text" style={styles.message}>
              I want to make sure we vibe well together! How do you want me to talk to you?
            </Typography>

            <View style={styles.selectorContainer}>
              <PersonalitySelector
                value={currentPersonality}
                onChange={onSelect}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...Shadows.xl,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  headerEmoji: {
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    textAlign: 'center',
  },
  content: {
    padding: Spacing.xl,
  },
  message: {
    marginBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectorContainer: {
    marginBottom: Spacing.md,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
