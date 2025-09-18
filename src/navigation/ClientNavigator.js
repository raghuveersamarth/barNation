import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import WorkoutScreen from '../screens/client/WorkoutScreen';
import ProgressScreen from '../screens/client/ProgressScreen';
import HistoryScreen from '../screens/client/HistoryScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function ClientNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 1,
          borderTopColor: '#00ff41',
          shadowColor: '#00ff41',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: '#00ff41',
        tabBarInactiveTintColor: '#404040',
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen 
        name="Today" 
        component={ClientDashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="today" color={color} size={24} />
            null
          ),
        }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="fitness-center" color={color} size={24} />
            null
          ),
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="trending-up" color={color} size={24} />
            null
          ),
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="history" color={color} size={24} />
            null
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="person" color={color} size={24} />
            null
          ),
        }}
      />
    </Tab.Navigator>
  );
}
