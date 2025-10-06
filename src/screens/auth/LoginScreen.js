import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Use clearer destructuring
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // const user = data.user; // cleaner reference
      // if (user) {
      //   // Check if user exists in public.users table
      //   const { data: existing, error: selErr } = await supabase
      //     .from("users")
      //     .select("id")
      //     .eq("id", user.id)
      //     .maybeSingle();
      //   if (selErr) throw selErr;

      //   // Insert into users table if not exists
      //   if (!existing) {
      //     const md = user.user_metadata ?? {};
      //     const { error: upsertErr } = await supabase.from("users").upsert(
      //       {
      //         id: user.id,
      //         email: user.email ?? email,
      //         role: md.role ?? null, // don't force "client" here
      //         name: md.name ?? null,
      //         age: md.age ?? null,
      //         gender: md.gender ?? null,
      //       },
      //       { onConflict: "id" }
      //     );
      //     if (upsertErr) throw upsertErr;
      //   }
      // }

      // AppNavigator handles navigation after login
      Alert.alert("Welcome Back", "Successfully logged into the BarNation");
    } catch (err) {
      Alert.alert("Login Failed", err.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      Alert.alert(
        "Reset Email Sent",
        "Check your email for password reset instructions"
      );
    } catch (error) {
      Alert.alert("Reset Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>WELCOME BACK TO THE</Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.titleGlow}>BAR</Text>
          <Text style={styles.titleGlow2}>NATION</Text>
        </View>
        <Text style={styles.subtitle}>
          Log in to your streetlifting account
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#737373"
          accessibilityLabel="Email input"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          blurOnSubmit={false}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            ref={passwordInputRef}
            placeholder="Password"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#737373"
            accessibilityLabel="Password input"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            style={styles.showPasswordButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? "Hide password" : "Show password"
            }
          >
            <Text style={styles.showPasswordText}>
              {showPassword ? "HIDE" : "SHOW"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleForgotPassword}
          activeOpacity={0.7}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgotPasswordText}>FORGOT PASSWORD?</Text>
        </TouchableOpacity>

        <CustomButton
          title={isLoading ? "LOGGING IN..." : "ENTER THE BARNATION"}
          onPress={handleLogin}
          disabled={isLoading}
          variant="primary"
        />

        <CustomButton
          title="NEW TO THE BARNATION? SIGN UP"
          onPress={() => navigation.navigate("Signup")}
          variant="secondary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// Reusable Button Component
function CustomButton({ title, onPress, disabled, variant = "primary" }) {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return [
          styles.button,
          styles.buttonPrimary,
          disabled && styles.buttonDisabled,
        ];
      case "secondary":
        return [styles.button, styles.buttonSecondary];
      default:
        return [styles.button, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "primary":
        return [styles.buttonText, styles.buttonTextPrimary];
      case "secondary":
        return [styles.buttonText, styles.buttonTextSecondary];
      default:
        return [styles.buttonText, styles.buttonTextPrimary];
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },
  titleGlow: {
    color: "#ffffffff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "#00ff41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleGlow2: {
    color: "#00ff41",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "#00ff41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: "#d4d4d4",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  form: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#262626",
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 16,
  },
  showPasswordButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
    zIndex: 1,
  },
  showPasswordText: {
    color: "#00ff41",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 1,
  },
  forgotPassword: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#00ff41",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 1,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: "#00ff41",
    shadowColor: "#00ff41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00ff41",
  },
  buttonDisabled: {
    backgroundColor: "#404040",
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  buttonTextPrimary: {
    color: "#000000",
  },
  buttonTextSecondary: {
    color: "#00ff41",
  },
});
