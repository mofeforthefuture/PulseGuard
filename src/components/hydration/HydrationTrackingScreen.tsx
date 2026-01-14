import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WaterLevelIndicator } from './WaterLevelIndicator';
import { DrinkButton } from './DrinkButton';
import { useALARA } from '../../context/ALARAContext';
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
} from '../../lib/design/tokens';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';

interface HydrationTrackingScreenProps {
  onDrink: (amount: number) => void;
  currentAmount?: number;
  goalAmount?: number;
  showReminder?: boolean;
}

const DEFAULT_GOAL = 2000; // 2L per day
const DRINK_OPTIONS = [
  { amount: 250, label: 'Glass', icon: '🥛' },
  { amount: 500, label: 'Bottle', icon: '💧' },
  { amount: 750, label: 'Large', icon: '🍶' },
  { amount: 1000, label: 'Liter', icon: '🚰' },
];

export function HydrationTrackingScreen({
  onDrink,
  currentAmount = 0,
  goalAmount = DEFAULT_GOAL,
  showReminder = false,
}: HydrationTrackingScreenProps) {
  const { setState, showMessage } = useALARA();
  const [localAmount, setLocalAmount] = useState(currentAmount);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Update local amount when prop changes
  useEffect(() => {
    setLocalAmount(currentAmount);
  }, [currentAmount]);

  // Check for goal completion
  useEffect(() => {
    if (localAmount >= goalAmount && localAmount > 0) {
      setShowCelebration(true);
      setState('calm');
      showMessage({
        text: `🎉 Amazing! You've reached your hydration goal!`,
        duration: 5000,
      });

      // Celebration animation
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          useNativeDriver: true,
          ...Animation.spring,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: Animation.normal,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide after delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(celebrationScale, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowCelebration(false);
        });
      }, 3000);
    }
  }, [localAmount, goalAmount, setState, showMessage, celebrationScale, celebrationOpacity]);

  const handleDrink = (amount: number) => {
    const newAmount = localAmount + amount;
    setLocalAmount(newAmount);
    onDrink(amount);

    // Positive feedback
    if (newAmount < goalAmount) {
      const percentage = (newAmount / goalAmount) * 100;
      if (percentage >= 50 && percentage < 75) {
        showMessage({
          text: '💪 Halfway there! Keep it up!',
          duration: 3000,
        });
      } else if (percentage >= 75 && percentage < 100) {
        showMessage({
          text: '🌟 Almost there! You\'re doing great!',
          duration: 3000,
        });
      }
    }
  };

  const percentage = Math.min((localAmount / goalAmount) * 100, 100);
  const isComplete = localAmount >= goalAmount;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Gradients.background.start, Gradients.background.end]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h1" color="text" weight="bold" style={styles.title}>
            Stay Hydrated 💧
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.subtitle}>
            Track your daily water intake
          </Typography>
        </View>

        {/* Water Level Indicator */}
        <View style={styles.indicatorContainer}>
          <WaterLevelIndicator
            currentAmount={localAmount}
            goalAmount={goalAmount}
            showGlow={showReminder}
            size="lg"
          />
        </View>

        {/* Progress Card */}
        <Card variant="gradient" padding="lg" style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <View style={styles.progressItem}>
              <Typography variant="h2" color="text" weight="bold">
                {Math.round(percentage)}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Complete
              </Typography>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Typography variant="h2" color="text" weight="bold">
                {Math.round(goalAmount - localAmount)}ml
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Remaining
              </Typography>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: isComplete ? Colors.success : Colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* Quick Drink Buttons */}
        <View style={styles.drinksSection}>
          <Typography variant="h2" color="text" weight="bold" style={styles.sectionTitle}>
            Quick Add
          </Typography>
          <View style={styles.drinksGrid}>
            {DRINK_OPTIONS.map((option, index) => (
              <DrinkButton
                key={option.amount}
                amount={option.amount}
                label={option.label}
                icon={option.icon}
                onPress={() => handleDrink(option.amount)}
                delay={index * 100}
              />
            ))}
          </View>
        </View>

        {/* Completion Message */}
        {isComplete && (
          <Card variant="calm" padding="xl" style={styles.completionCard}>
            <Typography variant="h2" color="text" weight="bold" style={styles.completionTitle}>
              🎉 Goal Achieved!
            </Typography>
            <Typography variant="body" color="textSecondary" style={styles.completionText}>
              You've reached your daily hydration goal. Great job staying hydrated!
            </Typography>
          </Card>
        )}

        {/* Tips Card */}
        <Card variant="gradient" padding="md" style={styles.tipsCard}>
          <Typography variant="h3" color="text" weight="semibold" style={styles.tipsTitle}>
            💡 Hydration Tips
          </Typography>
          <Typography variant="bodySmall" color="textSecondary" style={styles.tip}>
            • Drink water when you wake up
          </Typography>
          <Typography variant="bodySmall" color="textSecondary" style={styles.tip}>
            • Keep a water bottle nearby
          </Typography>
          <Typography variant="bodySmall" color="textSecondary" style={styles.tip}>
            • Set reminders throughout the day
          </Typography>
        </Card>
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            },
          ]}
          pointerEvents="none"
        >
          <CelebrationParticles />
        </Animated.View>
      )}
    </View>
  );
}

// Celebration Particles Component
function CelebrationParticles() {
  const particleAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    particleAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000 + i * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [particleAnims]);

  const emojis = ['💧', '✨', '🌟', '💫', '🎉', '🎊'];

  return (
    <View style={styles.particlesContainer}>
      {particleAnims.map((anim, i) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -200 - i * 20],
        });

        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (i % 2 === 0 ? 1 : -1) * (50 + i * 10)],
        });

        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 * (i + 1)}deg`],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1, 0],
        });

        const emoji = emojis[i % emojis.length];

        return (
          <Animated.Text
            key={i}
            style={[
              styles.particle,
              {
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity,
              },
            ]}
          >
            {emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  indicatorContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  progressCard: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  progressBarContainer: {
    marginTop: Spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.border + '40',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  drinksSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  drinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  completionCard: {
    width: '100%',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  completionTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  completionText: {
    textAlign: 'center',
  },
  tipsCard: {
    width: '100%',
  },
  tipsTitle: {
    marginBottom: Spacing.sm,
  },
  tip: {
    marginBottom: Spacing.xs,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 32,
  },
});
