import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from '../../src/components/ui/SafeAreaView';
import { HydrationTrackingScreen } from '../../src/components/hydration';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase/client';

export default function HydrationScreen() {
  const { user } = useAuth();
  const [currentAmount, setCurrentAmount] = useState(0);
  const [goalAmount] = useState(2000); // 2L default
  const [showReminder, setShowReminder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHydrationData();
    
    // Check for reminder (every 2 hours)
    const reminderInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      // Show reminder if it's been 2+ hours and not at goal
      if (currentAmount < goalAmount && hours % 2 === 0) {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 10000); // Hide after 10 seconds
      }
    }, 60000); // Check every minute

    return () => clearInterval(reminderInterval);
  }, [currentAmount, goalAmount]);

  const loadHydrationData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Load from health_entries (hydration tracking)
      const { data, error } = await supabase
        .from('health_entries')
        .select('data')
        .eq('user_id', user.id)
        .eq('entry_type', 'vital')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading hydration:', error);
      } else {
        // Sum up all hydration entries for today
        const total = (data || []).reduce((sum, entry) => {
          const entryData = entry.data as any;
          if (entryData?.type === 'hydration' && entryData?.amount) {
            return sum + entryData.amount;
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
      }
    } catch (error) {
      console.error('Error saving hydration:', error);
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

