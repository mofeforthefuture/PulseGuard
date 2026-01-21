import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Typography } from '../../src/components/ui/Typography';
import { QuickActionsGrid } from '../../src/components/ui/QuickActionsGrid';
import { RecentActivityCard } from '../../src/components/ui/RecentActivityCard';
import { UpcomingClinicalDatesCard, CareSummaryCard } from '../../src/components/care';
import { useRouter } from 'expo-router';
import { Spacing } from '../../src/lib/design/tokens';
import { useAuth } from '../../src/context/AuthContext';
import { getUpcomingClinicalDates } from '../../src/lib/services/clinicalDateService';
import { getNextAppointment } from '../../src/lib/services/careService';
import { getMedicalCheckup } from '../../src/lib/services/checkupService';
import { getDoctorVisitReminders } from '../../src/lib/services/doctorVisitReminderService';
import { getRecentActivityLogs } from '../../src/lib/services/activityService';
import type { ClinicalDate } from '../../src/types/care';
import type { Appointment } from '../../src/types/care';
import type { MedicalCheckup } from '../../src/types/care';
import type { DoctorVisitReminder } from '../../src/types/care';
import type { ActivityLog } from '../../src/types/activity';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [upcomingClinicalDates, setUpcomingClinicalDates] = useState<ClinicalDate[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [checkup, setCheckup] = useState<MedicalCheckup | null>(null);
  const [nextDoctorReminder, setNextDoctorReminder] = useState<DoctorVisitReminder | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        // Load all dashboard data in parallel
        const [dates, appointment, checkupData, reminders, activities] = await Promise.all([
          getUpcomingClinicalDates(user.id, 30),
          getNextAppointment(user.id),
          getMedicalCheckup(user.id),
          getDoctorVisitReminders(user.id, false),
          getRecentActivityLogs(user.id, 5),
        ]);

        setUpcomingClinicalDates(dates);
        setNextAppointment(appointment);
        setCheckup(checkupData);
        setRecentActivities(activities);
        
        // Get the next doctor reminder (earliest date)
        if (reminders.length > 0) {
          const sorted = reminders.sort((a, b) => {
            const dateA = new Date(a.reminder_date).getTime();
            const dateB = new Date(b.reminder_date).getTime();
            return dateA - dateB;
          });
          setNextDoctorReminder(sorted[0]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Transform activity logs for RecentActivityCard
  const activityItems = recentActivities.map((log) => ({
    id: log.id,
    title: `${log.steps_count.toLocaleString()} steps`,
    date: log.date,
    type: 'activity',
  }));

  const quickActions = [
    {
      title: 'Emergency',
      route: '/(tabs)/emergency',
      variant: 'emergency' as const,
    },
    {
      title: 'Care & Appointments',
      route: '/(tabs)/care',
      variant: 'primary' as const,
    },
    {
      title: 'Hydration',
      route: '/(tabs)/hydration',
      variant: 'primary' as const,
    },
    {
      title: 'History',
      route: '/(tabs)/history',
      variant: 'primary' as const,
    },
  ];

  return (
    <SafeAreaView>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Typography variant="h1" color="text" weight="bold" style={styles.title}>
          Dashboard
        </Typography>

        {/* 1. Daily Check-In Card */}
        <Card variant="calm">
          <Typography variant="h3" color="text" weight="semibold" style={styles.cardTitle}>
            Daily Check-In
          </Typography>
          <Typography variant="body" color="textSecondary" style={styles.cardSubtitle}>
            How are you feeling today?
          </Typography>
          <Button
            title="Check in with ALARA"
            onPress={() => router.push('/(tabs)/check-in')}
            style={styles.cardButton}
          />
        </Card>

        {/* 2. Care Summary Card */}
        <CareSummaryCard
          nextAppointment={nextAppointment}
          checkup={checkup}
          nextDoctorReminder={nextDoctorReminder}
        />

        {/* 3. Quick Actions Grid (2x2) */}
        <QuickActionsGrid actions={quickActions} />

        {/* 4. Upcoming Clinical Dates Card */}
        <UpcomingClinicalDatesCard clinicalDates={upcomingClinicalDates} maxItems={3} />

        {/* 5. Recent Activity Card */}
        <RecentActivityCard activities={activityItems} />
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
    paddingBottom: Spacing.xxl,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
  },
  cardButton: {
    marginTop: Spacing.sm,
  },
});



