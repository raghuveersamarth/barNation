import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import ClientListScreen from '../screens/coach/ClientListScreen';
import AnalyticsScreen from '../screens/coach/AnalyticsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function CoachNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#ff6b35',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CoachDashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // You can add icons here when you install react-native-vector-icons
            // <Icon name="dashboard" color={color} size={24} />
            null
          ),
        }}
      />
      <Tab.Screen 
        name="Clients" 
        component={ClientListScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="people" color={color} size={24} />
            null
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            // <Icon name="analytics" color={color} size={24} />
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
