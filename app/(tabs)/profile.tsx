import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, FontSizes } from '../../src/lib/utils/constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <Card>
          <Text style={styles.cardTitle}>Medical Profile</Text>
          <Text style={styles.cardSubtitle}>
            {user?.full_name || user?.email || 'No profile set up'}
          </Text>
          <Button
            title="Edit Profile"
            onPress={() => {
              // TODO: Navigate to profile edit
            }}
            variant="outline"
            style={styles.cardButton}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Emergency Contacts</Text>
          <Text style={styles.emptyText}>No emergency contacts set</Text>
          <Button
            title="Add Contact"
            onPress={() => {
              // TODO: Add emergency contact
            }}
            variant="outline"
            style={styles.cardButton}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Reminders</Text>
          <Text style={styles.emptyText}>No reminders set</Text>
          <Button
            title="Manage Reminders"
            onPress={() => {
              // TODO: Manage reminders
            }}
            variant="outline"
            style={styles.cardButton}
          />
        </Card>

        <Button
          title="Sign Out"
          onPress={signOut}
          variant="outline"
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
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
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  signOutButton: {
    marginTop: Spacing.xl,
    borderColor: Colors.error,
  },
});



