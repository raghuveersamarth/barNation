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
import CreateWorkoutScreen from "../screens/coach/CreateWorkoutScreen";
import ChooseWorkoutTypeScreen from "../screens/coach/ChooseWorkoutTypeScreen";
import WorkoutDetailScreen from "../screens/client/WorkoutDetailScreen";
import LogExerciseScreen from "../screens/client/LogExerciseScreen";
import ReviewWorkoutScreen from "../screens/coach/ReviewWorkoutScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCoach, setHasCoach] = useState(false);

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
    // console.log(user);
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) ensureUserInDB(session.user);
      else setUserRole(null);
    });
    const checkCoach = async (userId) => {
      try {
        const { data, error } = await supabase
          .from("coach_clients")
          .select("id")
          .eq("client_id", userId)
          .single();
        if (error && error.code !== "PGRST116") throw error; // Ignore "No rows found" error
        setHasCoach(!!data);
      } catch (err) {
        console.error("Error checking coach connection:", err);
      }
    };
    if (user?.id) checkCoach(user.id);
    // Refresh user profile when app comes to foreground
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active" && user) ensureUserInDB(user);
      }
    );

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
        .select(
          "id, role, profile_complete, subscription_tier, subscription_status"
        )
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
        {user &&
          userRole?.profile_complete &&
          userRole.role === "coach" &&
          (userRole.subscription_tier &&
          userRole.subscription_status === "active" ? (
            <Stack.Screen name="CoachApp" component={CoachNavigator} />
          ) : (
            <Stack.Screen
              name="CoachSubscription"
              component={SubscriptionScreen}
            />
          ))}

        {user && userRole?.profile_complete && userRole.role === "client" && (
          <>
            {/* Always show CoachConnection modal first for clients */}
            {!hasCoach ? (
              <Stack.Screen
                name="CoachConnection"
                component={CoachConnectionScreen}
                options={{ presentation: "modal" }}
              />
            ) : (
              <Stack.Screen name="ClientApp" component={ClientNavigator} />
            )}
            {/* After connecting to coach, show ClientApp */}
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
        <Stack.Screen
          name="CreateWorkout"
          component={CreateWorkoutScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="ChooseWorkoutType"
          component={ChooseWorkoutTypeScreen}
        />
        <Stack.Screen
          name="WorkoutDetail"
          component={WorkoutDetailScreen}
        />
        <Stack.Screen
          name="LogExerciseScreen"
          component={LogExerciseScreen}
        />
        <Stack.Screen
          name="ReviewWorkout"
          component={ReviewWorkoutScreen}
          options={{ presentation: "modal" }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
