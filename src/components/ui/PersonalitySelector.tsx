import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { useColors } from '../../lib/design/useColors';
import { Spacing, BorderRadius } from '../../lib/design/tokens';
import type { ALARAPersonality } from '../../lib/openrouter/client';

interface PersonalitySelectorProps {
  value: ALARAPersonality;
  onChange: (personality: ALARAPersonality) => void;
}

const PERSONALITIES: Array<{
  value: ALARAPersonality;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and supportive',
    emoji: '😊',
  },
  {
    value: 'sassy',
    label: 'Sassy',
    description: 'Witty with attitude',
    emoji: '😏',
  },
  {
    value: 'rude',
    label: 'Rude',
    description: 'Brutally honest',
    emoji: '🙄',
  },
  {
    value: 'fun_nurse',
    label: 'Fun Nurse',
    description: 'Bubbly and energetic',
    emoji: '🏥',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Knowledgeable and precise',
    emoji: '👔',
  },
  {
    value: 'caring',
    label: 'Caring',
    description: 'Gentle and nurturing',
    emoji: '💙',
  },
];

export function PersonalitySelector({ value, onChange }: PersonalitySelectorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {PERSONALITIES.map((personality, index) => {
        const isSelected = value === personality.value;
        const isLast = index === PERSONALITIES.length - 1;

        return (
          <TouchableOpacity
            key={personality.value}
            onPress={() => onChange(personality.value)}
            activeOpacity={0.7}
            style={[
              styles.option,
              !isLast && { borderBottomColor: colors.border + '20', borderBottomWidth: 1 },
              isSelected && { backgroundColor: colors.primary + '10' },
            ]}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <Typography variant="h3" style={styles.emoji}>
                  {personality.emoji}
                </Typography>
                <View style={styles.optionText}>
                  <Typography variant="body" color="text" weight={isSelected ? 'semibold' : 'regular'}>
                    {personality.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {personality.description}
                  </Typography>
                </View>
              </View>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Typography variant="caption" style={styles.checkmarkText}>
                    ✓
                  </Typography>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    marginRight: Spacing.md,
    width: 40,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
