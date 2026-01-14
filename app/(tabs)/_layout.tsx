import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../../src/lib/utils/constants';

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.surface,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color }) => (
            <TabIcon name="alert-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <TabIcon name="clock" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple icon component (you can replace with react-native-vector-icons later)
function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: name === 'alert-circle' ? color : 'transparent',
        borderWidth: name === 'alert-circle' ? 2 : 0,
        borderColor: color,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});



