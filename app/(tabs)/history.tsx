import React from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { SafeAreaView } from "../../src/components/ui/SafeAreaView"
import { Card } from "../../src/components/ui/Card"
import { Typography } from "../../src/components/ui/Typography"
import { Spacing } from "../../src/lib/design/tokens"

export default function HistoryScreen() {
  return (
    <SafeAreaView>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Typography variant="h1" color="text" weight="bold" style={styles.title}>
          History
        </Typography>

        <Card>
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Crisis Timeline
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
            No crisis events recorded
          </Typography>
        </Card>

        <Card>
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Check-In History
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
            No check-ins yet
          </Typography>
        </Card>

        <Card>
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Health Trends
          </Typography>
          <Typography variant="bodySmall" color="textLight" style={styles.emptyText}>
            Start tracking to see trends
          </Typography>
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
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontStyle: "italic",
  },
})
