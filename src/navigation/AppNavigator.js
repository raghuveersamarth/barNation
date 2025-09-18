import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "../services/supabase";
import AuthNavigator from "./AuthNavigator";
import CoachNavigator from "./CoachNavigator";
import ClientNavigator from "./ClientNavigator";
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import CoachConnectionScreen from "../screens/auth/CoachConnectionScreen";
import ProfileSetupScreen from "../screens/auth/ProfileSetupScreen";
import SubscriptionScreen from "../screens/shared/SubscriptionScreen";
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
        console.error("Error fetching session:", error);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("User session found on app load:", session.user);
        ensureUserInDB(session.user); // 👈 ensure DB row
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log("Auth state changed, user logged in:", session.user);
        ensureUserInDB(session.user); // 👈 ensure DB row
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👇 helper to ensure every logged-in user exists in your users table
  const ensureUserInDB = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, role, profile_complete")
        .eq("id", authUser.id)
        .maybeSingle(); // 👈 avoids throwing when row not found

      if (error) {
        throw error;
      }

      if (!data) {
        // No row exists → create one with defaults
        const { error: insertError } = await supabase.from("users").upsert({
          id: authUser.id,
          email: authUser.email,
          role: null,
          profile_complete: false,
          created_at: new Date().toISOString(),
        });

        if (insertError) throw insertError;

        setUserRole({ role: null, profile_complete: false });
      } else {
        setUserRole(data);
      }
    } catch (err) {
      console.error("Error ensuring user in DB:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // You can replace with a Splash/Loading component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          userRole?.profile_complete ? (
            userRole.role === "coach" ? (
              <Stack.Screen name="CoachApp" component={CoachNavigator} />
            ) : (
              <Stack.Screen name="ClientApp" component={ClientNavigator} />
            )
          ) : (
            <>
              <Stack.Screen
                name="RoleSelection"
                component={RoleSelectionScreen}
                initialParams={{ userId: user?.id, email: user?.email }}
              />

              <Stack.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
              />
            </>
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}

        {/* Global modals */}
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ presentation: "modal" }}
        />
          <Stack.Screen
          name="CoachConnection"
          component={CoachConnectionScreen}
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
