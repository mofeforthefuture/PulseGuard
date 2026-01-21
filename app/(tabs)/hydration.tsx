import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { HydrationTrackingScreen } from '../../src/components/hydration';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase/client';

const DEFAULT_GOAL = 2000; // 2L per day
const REMINDER_INTERVAL_HOURS = 2; // Remind every 2 hours

export default function HydrationScreen() {
  const { user } = useAuth();
  const [currentAmount, setCurrentAmount] = useState(0);
  const [goalAmount] = useState(DEFAULT_GOAL);
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastReminderTime = useRef<Date | null>(null);

  // Load hydration data and check for daily reset
  useEffect(() => {
    loadHydrationData();
    
    // Check for reminder every minute
    const reminderInterval = setInterval(() => {
      checkReminder();
    }, 60000); // Check every minute

    return () => clearInterval(reminderInterval);
  }, []);

  // Check reminder logic
  const checkReminder = () => {
    if (!user?.id || currentAmount >= goalAmount) {
      setShowReminder(false);
      return;
    }

    const now = new Date();
    const hoursSinceLastReminder = lastReminderTime.current
      ? (now.getTime() - lastReminderTime.current.getTime()) / (1000 * 60 * 60)
      : REMINDER_INTERVAL_HOURS + 1; // First reminder after 2 hours

    // Show reminder if it's been 2+ hours since last reminder
    if (hoursSinceLastReminder >= REMINDER_INTERVAL_HOURS) {
      setShowReminder(true);
      lastReminderTime.current = now;
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setShowReminder(false);
      }, 10000);
    }
  };

  const loadHydrationData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Load from health_entries (hydration tracking) - only today's entries
      const { data, error } = await supabase
        .from('health_entries')
        .select('data, created_at')
        .eq('user_id', user.id)
        .eq('entry_type', 'vital')
        .gte('created_at', todayStr)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading hydration:', error);
      } else {
        // Sum up all hydration entries for today
        const total = (data || []).reduce((sum, entry) => {
          const entryData = entry.data as any;
          if (entryData?.type === 'hydration' && entryData?.amount) {
            // Verify entry is from today (daily reset logic)
            const entryDate = new Date(entry.created_at);
            if (entryDate >= today) {
              return sum + entryData.amount;
            }
          }
          return sum;
        }, 0);
        setCurrentAmount(total);
      }
    } catch (error) {
      console.error('Error loading hydration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrink = async (amount: number) => {
    if (!user?.id) return;

    const newAmount = currentAmount + amount;
    setCurrentAmount(newAmount);

    try {
      // Save to health_entries
      const { error } = await supabase.from('health_entries').insert({
        user_id: user.id,
        entry_type: 'vital',
        data: {
          type: 'hydration',
          amount: amount,
          total: newAmount,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        console.error('Error saving hydration:', error);
        // Revert on error
        setCurrentAmount(currentAmount);
      } else {
        // Hide reminder if we're now at or above goal
        if (newAmount >= goalAmount) {
          setShowReminder(false);
        }
      }
    } catch (error) {
      console.error('Error saving hydration:', error);
      // Revert on error
      setCurrentAmount(currentAmount);
    }
  };

  if (loading) {
    return (
      <SafeAreaView>
        <LoadingState message="Loading your hydration data..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <HydrationTrackingScreen
        onDrink={handleDrink}
        currentAmount={currentAmount}
        goalAmount={goalAmount}
        showReminder={showReminder}
      />
    </SafeAreaView>
  );
}

