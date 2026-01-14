/**
 * ALARA Usage Examples
 * 
 * This file shows how to use the FloatingALARA mascot in your screens.
 * Copy these patterns into your components.
 */

import { useALARA } from '../../context/ALARAContext';
import { useEffect } from 'react';

// Example 1: Show a welcome message when component mounts
export function WelcomeExample() {
  const { showMessage, setState } = useALARA();

  useEffect(() => {
    // Set state to calm
    setState('calm');
    
    // Show a welcome message
    showMessage({
      text: "Welcome back! How are you feeling today?",
      duration: 5000, // Auto-dismiss after 5 seconds
    });
  }, [showMessage, setState]);

  return null; // Your component JSX
}

// Example 2: Show reminder message
export function ReminderExample() {
  const { showMessage, setState } = useALARA();

  const handleReminder = () => {
    setState('reminder');
    showMessage({
      text: "Don't forget to take your medication at 2 PM!",
      duration: 6000,
      priority: 'medium',
    });
  };

  return null; // Your component JSX with button that calls handleReminder
}

// Example 3: Show concern message
export function ConcernExample() {
  const { showMessage, setState } = useALARA();

  const handleConcern = () => {
    setState('concern');
    showMessage({
      text: "I noticed you haven't checked in today. Everything okay?",
      duration: 8000, // Longer duration for important messages
      priority: 'high',
    });
  };

  return null; // Your component JSX
}

// Example 4: Show thinking state (for loading/processing)
export function ThinkingExample() {
  const { setState, hideMessage } = useALARA();

  const handleProcessing = async () => {
    setState('thinking');
    
    // Do some async work
    await someAsyncOperation();
    
    // Show result
    setState('calm');
    showMessage({
      text: "All done! Your data has been saved.",
      duration: 3000,
    });
  };

  return null; // Your component JSX
}

// Example 5: Conditional messages based on state
export function ConditionalExample() {
  const { showMessage, setState } = useALARA();
  const healthStatus = 'good'; // Your health status logic

  useEffect(() => {
    if (healthStatus === 'good') {
      setState('calm');
      showMessage({
        text: "Your health looks great! Keep up the good work.",
        duration: 5000,
      });
    } else if (healthStatus === 'warning') {
      setState('concern');
      showMessage({
        text: "I noticed some patterns. Let's check in together.",
        duration: 7000,
      });
    }
  }, [healthStatus, showMessage, setState]);

  return null; // Your component JSX
}

// Helper function for common messages
export function useALARAMessages() {
  const { showMessage, setState } = useALARA();

  return {
    showWelcome: () => {
      setState('calm');
      showMessage({
        text: "Hi! I'm ALARA, your health companion. I'm here to help!",
        duration: 6000,
      });
    },
    showCheckInReminder: () => {
      setState('reminder');
      showMessage({
        text: "Time for your daily check-in! How are you feeling?",
        duration: 6000,
      });
    },
    showMedicationReminder: (medication: string, time: string) => {
      setState('reminder');
      showMessage({
        text: `Don't forget: ${medication} at ${time}`,
        duration: 7000,
      });
    },
    showEncouragement: () => {
      setState('calm');
      showMessage({
        text: "You're doing great! Keep taking care of yourself.",
        duration: 5000,
      });
    },
    showConcern: () => {
      setState('concern');
      showMessage({
        text: "I'm here if you need to talk. Your health matters.",
        duration: 8000,
      });
    },
  };
}

// Mock function for example
async function someAsyncOperation() {
  return new Promise((resolve) => setTimeout(resolve, 2000));
}
