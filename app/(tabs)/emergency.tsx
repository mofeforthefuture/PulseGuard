import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/lib/utils/constants';

export default function EmergencyScreen() {
  const [isActive, setIsActive] = useState(false);

  const handlePanicButton = () => {
    Alert.alert(
      'Emergency Activated',
      'Your emergency contacts will be notified. Help is on the way.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsActive(false),
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            // TODO: Trigger emergency actions
            setIsActive(true);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.title}>Emergency</Text>

        <View style={styles.panicContainer}>
          <Button
            title={isActive ? 'Emergency Active' : 'Panic Button'}
            onPress={handlePanicButton}
            variant="emergency"
            style={[
              styles.panicButton,
              isActive && styles.panicButtonActive,
            ]}
          />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Location Sharing</Text>
          <Text style={styles.cardSubtitle}>
            Share your location with emergency contacts
          </Text>
          <Button
            title="Enable Location"
            onPress={() => {
              // TODO: Enable location sharing
            }}
            variant="outline"
            style={styles.cardButton}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Emergency SMS</Text>
          <Text style={styles.cardSubtitle}>
            Send pre-configured emergency message
          </Text>
          <Button
            title="Send SMS"
            onPress={() => {
              // TODO: Generate and send SMS
            }}
            variant="outline"
            style={styles.cardButton}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  panicContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  panicButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    paddingVertical: Spacing.xl,
  },
  panicButtonActive: {
    backgroundColor: Colors.success,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
});



