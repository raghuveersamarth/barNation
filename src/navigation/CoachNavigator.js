import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import LottieView from "lottie-react-native";
import CoachDashboardScreen from "../screens/coach/CoachDashboardScreen";
import ClientListScreen from "../screens/coach/ClientListScreen";
import AnalyticsScreen from "../screens/coach/AnalyticsScreen";
import Library from "../screens/coach/Library";
import ProfileScreen from "../screens/shared/ProfileScreen";
const Tab = createBottomTabNavigator();
export default function CoachNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopWidth: 1,
          borderTopColor: "#00ff41",
          shadowColor: "#00ff41",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          height: 60,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: "#00ff41",
        tabBarInactiveTintColor: "#404040",
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11, letterSpacing: 1 },
        tabBarIconStyle: { marginTop: 5 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={CoachDashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientListScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>📈</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={Library}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>📈</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
