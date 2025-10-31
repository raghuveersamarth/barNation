import { useState, useRef, useEffect } from "react";
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
  ImageBackground,
  Image,
  Animated, // We need Animated
  Easing, // And Easing for smooth animations
} from "react-native";
import { supabase } from "../../services/supabase";

const brandColor = "#F97316"; // Fiery orange

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Added for signup
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false); // Added for signup

  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null); // Added for signup

  // --- Animation Values ---
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity
  const slideAnimBottom = useRef(new Animated.Value(20)).current; // Slide up from bottom
  const slideAnimTop = useRef(new Animated.Value(-20)).current; // Slide down from top

  // Entry Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimBottom, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimTop, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnimBottom, slideAnimTop]);

  // --- Handlers ---
  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          Alert.alert(
            "Account Exists",
            "An account with this email already exists. Please sign in."
          );
        } else {
          throw error;
        }
      } else if (data.user && !data.session) {
        Alert.alert(
          "Check Your Email",
          "A confirmation link has been sent to your email. Please verify your account to log in."
        );
        navigation.navigate("Login"); // Navigate to login after successful signup prompt
      } else if (data.user && data.session) {
         // This case handles auto-login if enabled
         Alert.alert("Success!", "Account created successfully.");
         // You might navigate directly into the app here
      }
    } catch (error) {
      Alert.alert("Signup Failed", error.message ?? String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/login_BG.jpg")} // Corrected path
      style={styles.screenContainer}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.container} // This controls the split-screen layout
            keyboardShouldPersistTaps="handled"
          >
            {/* --- TOP CARD (Header) --- */}
            <Animated.View
              style={[
                styles.topCard, // Container for top content
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnimTop }],
                },
              ]}
            >
              <View style={styles.header}>
                <Image
                  source={require("../../../assets/logo.jpg")} // Corrected path
                  style={styles.logo}
                  resizeMode="contain"
                />
                {/* Changed text to "CREATE ACCOUNT" */}
                <Text style={styles.appName}>CREATE ACCOUNT</Text>
              </View>
            </Animated.View>

            {/* --- BOTTOM CARD (Form & Links) --- */}
            <Animated.View
              style={[
                styles.bottomCard, // Container for bottom content
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnimBottom }],
                },
              ]}
            >
              {/* --- Form --- */}
              <View style={styles.inputContainer}>
                {/* Email Input */}
                <View
                  style={[
                    styles.inputGroup,
                    {
                      borderColor: emailFocused
                        ? "#FFF" // White border on focus
                        : "rgba(255, 255, 255, 0.2)",
                    },
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    cursorColor={brandColor}
                  />
                </View>

                {/* Password Input */}
                <View
                  style={[
                    styles.inputGroup,
                    {
                      borderColor: passwordFocused
                        ? "#FFF" // White border on focus
                        : "rgba(255, 255, 255, 0.2)",
                    },
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={true}
                    returnKeyType="next"
                    ref={passwordInputRef}
                    onSubmitEditing={() =>
                      confirmPasswordInputRef.current?.focus()
                    }
                    cursorColor={brandColor}
                  />
                </View>

                {/* Confirm Password Input */}
                <View
                  style={[
                    styles.inputGroup,
                    {
                      borderColor: confirmPasswordFocused
                        ? "#FFF" // White border on focus
                        : "rgba(255, 255, 255, 0.2)",
                    },
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={true}
                    returnKeyType="go"
                    ref={confirmPasswordInputRef}
                    onSubmitEditing={handleSignup}
                    cursorColor={brandColor}
                  />
                </View>

                {/* Sign Up Button */}
                <View
                  style={{
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.signInButton, // Reusing login button style
                      isLoading && styles.signInButtonDisabled,
                    ]}
                    onPress={handleSignup}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.signInButtonText}>
                      {isLoading ? "CREATING..." : "CREATE ACCOUNT"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* --- Links --- */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")} // Changed to navigate to Login
                  activeOpacity={0.7}
                >
                  <Text style={styles.signupLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

// --- Styles (Copied from LoginScreen, tagline removed) ---
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Brighter overlay
    justifyContent: "center",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1, // Make sure ScrollView content can grow
    justifyContent: "space-between", // --- ALIGNMENT KEPT ---
    alignItems: "center",
    paddingVertical: 40, // Padding at the very top and bottom
    paddingHorizontal: 24,
  },
  topCard: {
    width: "100%",
    alignItems: "center",
  },
  bottomCard: {
    width: "100%",
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginTop: 20, // Pushes it down from the status bar
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 32, // More space as requested
  },
  appName: {
    fontFamily: "Orbitron-Bold",
    fontSize: 36, // Slightly smaller for longer text
    color: "#fff",
    letterSpacing: 3,
    marginBottom: 8,
    fontWeight: "900",
    textAlign: "center",
    // --- GLOW REMOVED ---
  },
  // tagline style removed
  inputContainer: {
    width: "85%",
    maxWidth: 350,
    alignItems: "center",
    marginBottom: 10,
  },
  inputGroup: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 56,
    justifyContent: "center",
  },
  input: {
    width: "100%",
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#fff",
    paddingVertical: 8,
    textAlign: "left",
    letterSpacing: 0,
    height: 40,
  },
  signInButton: {
    width: "100%",
    backgroundColor: brandColor, // Solid orange
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    // --- MORE SHADOW ---
    shadowColor: "#000", // Dark shadow
    shadowOffset: { width: 0, height: 6 }, // Increased height
    shadowOpacity: 0.4, // Increased opacity
    shadowRadius: 8, // Increased blur
    elevation: 12, // Increased elevation
  },
  signInButtonDisabled: {
    backgroundColor: "#404040",
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    fontFamily: "Orbitron-Bold",
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
  },
  // forgotPassword style removed
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24, // Was 16, added more space
  },
  signupText: {
    fontFamily: "Inter-Regular",
    color: "#d8d8d8",
    fontSize: 14,
    fontWeight: "400",
    opacity: 0.8,
  },
  signupLink: {
    fontFamily: "Inter-Bold",
    color: brandColor,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
    textDecorationLine: "underline",
  },
});

