/**
 * ALARA Design System - Usage Examples
 * 
 * This file demonstrates how to use all components from the design system.
 * Copy these examples into your screens to see the design system in action.
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Typography, StatusBadge, Input } from '../../components/ui';
import { Spacing, Colors } from './tokens';

export function DesignSystemShowcase() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Typography Examples */}
      <Card padding="lg">
        <Typography variant="hero" style={styles.sectionTitle}>
          Typography
        </Typography>
        <Typography variant="display">Display Text</Typography>
        <Typography variant="h1">Heading 1</Typography>
        <Typography variant="h2">Heading 2</Typography>
        <Typography variant="h3">Heading 3</Typography>
        <Typography variant="body">Body text - This is the default body text style.</Typography>
        <Typography variant="bodySmall" color="textSecondary">
          Small body text for secondary information.
        </Typography>
        <Typography variant="caption" color="textLight">
          Caption text for metadata
        </Typography>
      </Card>

      {/* Button Examples */}
      <Card padding="lg">
        <Typography variant="h2" style={styles.sectionTitle}>
          Buttons
        </Typography>
        
        <Button title="Primary Button" onPress={() => {}} variant="primary" />
        <Button title="Secondary Button" onPress={() => {}} variant="secondary" style={styles.buttonSpacing} />
        <Button title="Emergency Button" onPress={() => {}} variant="emergency" style={styles.buttonSpacing} />
        <Button title="Outline Button" onPress={() => {}} variant="outline" style={styles.buttonSpacing} />
        
        <Typography variant="h4" style={styles.subsectionTitle}>
          Status Buttons
        </Typography>
        <Button title="Calm Status" onPress={() => {}} variant="calm" style={styles.buttonSpacing} />
        <Button title="Reminder" onPress={() => {}} variant="reminder" style={styles.buttonSpacing} />
        <Button title="Concern" onPress={() => {}} variant="concern" style={styles.buttonSpacing} />
        
        <Typography variant="h4" style={styles.subsectionTitle}>
          Sizes
        </Typography>
        <Button title="Small" onPress={() => {}} size="sm" style={styles.buttonSpacing} />
        <Button title="Medium (Default)" onPress={() => {}} size="md" style={styles.buttonSpacing} />
        <Button title="Large" onPress={() => {}} size="lg" style={styles.buttonSpacing} />
      </Card>

      {/* Card Examples */}
      <Card padding="lg">
        <Typography variant="h2" style={styles.sectionTitle}>
          Cards
        </Typography>
        
        <Card variant="default" shadow="md" padding="md" style={styles.cardSpacing}>
          <Typography variant="h3">Default Card</Typography>
          <Typography variant="body" color="textSecondary">
            This is a default card with medium shadow.
          </Typography>
        </Card>

        <Card variant="calm" shadow="md" padding="md" style={styles.cardSpacing}>
          <Typography variant="h3">Calm Status Card</Typography>
          <Typography variant="body">
            Everything looks good! Your health is on track.
          </Typography>
        </Card>

        <Card variant="reminder" shadow="md" padding="md" style={styles.cardSpacing}>
          <Typography variant="h3">Reminder Card</Typography>
          <Typography variant="body">
            Don't forget to take your medication at 2 PM.
          </Typography>
        </Card>

        <Card variant="concern" shadow="md" padding="md" style={styles.cardSpacing}>
          <Typography variant="h3">Concern Card</Typography>
          <Typography variant="body">
            We noticed some patterns. Please check in with your symptoms.
          </Typography>
        </Card>

        <Card variant="emergency" shadow="lg" padding="md" style={styles.cardSpacing}>
          <Typography variant="h3" color="text">
            Emergency Card
          </Typography>
          <Typography variant="body" color="text">
            This is for critical emergency information.
          </Typography>
        </Card>

        <Card variant="gradient" shadow="md" padding="lg" style={styles.cardSpacing}>
          <Typography variant="h3">Gradient Card</Typography>
          <Typography variant="body" color="textSecondary">
            A card with a subtle gradient background.
          </Typography>
        </Card>
      </Card>

      {/* Status Badge Examples */}
      <Card padding="lg">
        <Typography variant="h2" style={styles.sectionTitle}>
          Status Badges
        </Typography>
        
        <View style={styles.badgeRow}>
          <StatusBadge status="calm" label="All Good" />
          <StatusBadge status="reminder" label="Reminder" />
          <StatusBadge status="concern" label="Check In" />
          <StatusBadge status="emergency" label="Emergency" />
        </View>

        <Typography variant="h4" style={styles.subsectionTitle}>
          Variants
        </Typography>
        <View style={styles.badgeRow}>
          <StatusBadge status="calm" label="Gradient" variant="gradient" />
          <StatusBadge status="calm" label="Solid" variant="solid" />
          <StatusBadge status="calm" label="Outline" variant="outline" />
        </View>

        <Typography variant="h4" style={styles.subsectionTitle}>
          Sizes
        </Typography>
        <View style={styles.badgeRow}>
          <StatusBadge status="calm" label="Small" size="sm" />
          <StatusBadge status="calm" label="Medium" size="md" />
          <StatusBadge status="calm" label="Large" size="lg" />
        </View>
      </Card>

      {/* Input Examples */}
      <Card padding="lg">
        <Typography variant="h2" style={styles.sectionTitle}>
          Inputs
        </Typography>
        
        <Input
          label="Default Input"
          placeholder="Enter text here"
        />
        
        <Input
          label="Elevated Input"
          placeholder="With shadow"
          variant="elevated"
        />
        
        <Input
          label="Input with Error"
          placeholder="This has an error"
          error="This field is required"
        />
      </Card>

      {/* Combined Example */}
      <Card variant="calm" shadow="lg" padding="lg">
        <View style={styles.combinedHeader}>
          <StatusBadge status="calm" label="Status" />
          <Typography variant="h2" style={styles.combinedTitle}>
            Combined Example
          </Typography>
        </View>
        <Typography variant="body" color="textSecondary" style={styles.combinedDescription}>
          This card demonstrates how to combine multiple design system components
          for a cohesive, warm, and modern UI.
        </Typography>
        <Button
          title="Take Action"
          onPress={() => {}}
          variant="primary"
          style={styles.combinedButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  subsectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  buttonSpacing: {
    marginTop: Spacing.sm,
  },
  cardSpacing: {
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  combinedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  combinedTitle: {
    flex: 1,
  },
  combinedDescription: {
    marginBottom: Spacing.md,
  },
  combinedButton: {
    marginTop: Spacing.sm,
  },
});
