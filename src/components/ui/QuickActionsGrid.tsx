import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Typography } from './Typography';
import { Spacing } from '../../lib/design/tokens';
import { useRouter } from 'expo-router';

interface QuickAction {
  title: string;
  route: string;
  variant: 'primary' | 'secondary' | 'emergency' | 'outline' | 'calm' | 'reminder' | 'concern';
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  const router = useRouter();

  return (
    <Card>
      <Typography variant="h3" color="text" weight="semibold" style={styles.title}>
        Quick Actions
      </Typography>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <View key={index} style={styles.gridItem}>
            <Button
              title={action.title}
              onPress={() => router.push(action.route)}
              variant={action.variant}
              fullWidth
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
});
