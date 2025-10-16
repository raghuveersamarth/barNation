// src/navigation/AppNavigator.js
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppState } from "react-native";
import { supabase } from "../services/supabase";

import AuthNavigator from "./AuthNavigator";
import CoachNavigator from "./CoachNavigator";
import ClientNavigator from "./ClientNavigator";

import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import ProfileSetupScreen from "../screens/auth/ProfileSetupScreen";
import SubscriptionScreen from "../screens/shared/SubscriptionScreen";
import CoachConnectionScreen from "../screens/auth/CoachConnectionScreen";
import AddClientScreen from "../screens/coach/AddClientScreen";
import VideoUploadScreen from "../screens/client/VideoUploadScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) ensureUserInDB(session.user);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) ensureUserInDB(session.user);
      else setUserRole(null);
    });

    // Refresh user profile when app comes to foreground
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && user) ensureUserInDB(user);
    });

    return () => {
      subscription.unsubscribe();
      appStateSubscription?.remove();
    };
  }, [user?.id]);

  // Ensure user exists in DB
  const ensureUserInDB = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, role, profile_complete, subscription_tier, subscription_status")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await supabase.from("users").upsert({
          id: authUser.id,
          email: authUser.email,
          role: null,
          profile_complete: false,
          created_at: new Date().toISOString(),
        });
        setUserRole({ role: null, profile_complete: false });
      } else {
        setUserRole(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth / onboarding */}
        {!user && <Stack.Screen name="Auth" component={AuthNavigator} />}
        {user && !userRole?.profile_complete && (
          <>
            <Stack.Screen
              name="RoleSelection"
              component={RoleSelectionScreen}
              initialParams={{ userId: user?.id, email: user?.email }}
            />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          </>
        )}

        {/* Main apps */}
        {user && userRole?.profile_complete && userRole.role === "coach" && (
          userRole.subscription_tier && userRole.subscription_status === "active" ? (
            <Stack.Screen name="CoachApp" component={CoachNavigator} />
          ) : (
            <Stack.Screen name="CoachSubscription" component={SubscriptionScreen} />
          )
        )}

        {user && userRole?.profile_complete && userRole.role === "client" && (
          <>
            {/* Always show CoachConnection modal first for clients */}
            <Stack.Screen
              name="CoachConnection"
              component={CoachConnectionScreen}
              options={{ presentation: "modal" }}
            />
            {/* After connecting to coach, show ClientApp */}
            <Stack.Screen name="ClientApp" component={ClientNavigator} />
          </>
        )}

        {/* Global modals */}
        <Stack.Screen
          name="GlobalSubscription"
          component={SubscriptionScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="AddClient"
          component={AddClientScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="VideoUpload"
          component={VideoUploadScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
