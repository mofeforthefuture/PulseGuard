import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { SafeAreaView } from "../../src/components/ui/SafeAreaView"
import { Card } from "../../src/components/ui/Card"
import { Colors, Spacing, FontSizes } from "../../src/lib/utils/constants"

export default function HistoryScreen() {
  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>History</Text>

        <Card>
          <Text style={styles.cardTitle}>Crisis Timeline</Text>
          <Text style={styles.emptyText}>No crisis events recorded</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Check-In History</Text>
          <Text style={styles.emptyText}>No check-ins yet</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Health Trends</Text>
          <Text style={styles.emptyText}>Start tracking to see trends</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
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
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    fontStyle: "italic",
  },
})
