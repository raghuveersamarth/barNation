import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      Alert.alert("Success", "Welcome back to BarNation!");
    } catch (error) {
      Alert.alert("Login Failed", error.message ?? String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first.");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert("Success", "Check your email for reset instructions");
    } catch (error) {
      Alert.alert("Error", error.message ?? String(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Image
              source={require("../../../assets/logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>BARNATION</Text>
          <Text style={styles.tagline}>Strength Beyond Limits</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Welcome Back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="coach@barnation.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordInputRef}
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((s) => !s)}
                accessibilityLabel="Toggle password visibility"
              >
                <Text style={styles.eyeIconText}>
                  {showPassword ? "👁" : "👁‍🗨"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.signInButton,
              isLoading && styles.signInButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.signInButtonText}>
              {isLoading ? "SIGNING IN..." : "SIGN IN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to BarNation?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flexGrow: 1,
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#000000",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#ef4444",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    borderRadius: 50,
  },
  appName: {
    fontFamily: "Orbitron-Black", // Orbitron 900
    fontSize: 48,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 8,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: "Inter-Regular", // Inter 400
    fontSize: 16,
    fontWeight: "400",
    color: "#9ca3af",
    letterSpacing: 1,
  },
  formContainer: {
    width: "90%",
    marginHorizontal: 20,
    backgroundColor: "rgba(15, 15, 15, 0.95)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  formTitle: {
    fontFamily: "Orbitron-Bold", // Orbitron 700
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: 2,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter-Bold", // Inter 700
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  input: {
    fontFamily: "Inter-Regular", // Inter 400
    backgroundColor: "#1f1f1f",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    fontWeight: "400",
    color: "#ffffff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderRadius: 8,
  },
  passwordInput: {
    fontFamily: "Inter-Regular",
    flex: 1,
    padding: 14,
    fontSize: 16,
    fontWeight: "400",
    color: "#ffffff",
  },
  eyeIcon: {
    padding: 12,
  },
  eyeIconText: {
    fontSize: 20,
    color: "#ef4444",
  },
  signInButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  signInButtonDisabled: {
    backgroundColor: "#404040",
  },
  signInButtonText: {
    fontFamily: "Orbitron-Bold", // Orbitron 700
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
  },
  forgotPassword: {
    fontFamily: "Inter-Medium", // Inter 500
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 12,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  signupText: {
    fontFamily: "Inter-Regular",
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "400",
    marginRight: 6,
  },
  signupLink: {
    fontFamily: "Inter-Bold",
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
});
