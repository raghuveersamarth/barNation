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

// --- AnimatedTextInput component removed ---

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordInputRef = useRef(null);

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

  // --- Button Pulse Animation removed ---

  // --- Handlers ---
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
      // Navigation or logic after login goes here
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
                <Text style={styles.appName}>BARNATION</Text>
                <Text style={styles.tagline}>Strength Awaits</Text>
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
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    ref={passwordInputRef}
                    cursorColor={brandColor}
                  />
                </View>

                {/* Sign In Button */}
                <View
                  style={{
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.signInButton,
                      isLoading && styles.signInButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.signInButtonText}>
                      {isLoading ? "ENTERING..." : "ENTER THE GATE"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* --- Links --- */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Signup")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Made brighter (was 0.6)
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
    fontSize: 42,
    color: "#fff",
    letterSpacing: 3,
    marginBottom: 8,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(255, 115, 22, 0.5)", // Orange glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  tagline: {
    fontFamily: "Inter-Medium",
    fontSize: 18,
    color: "#E5E5E5",
    opacity: 0.8,
    fontWeight: "500",
    letterSpacing: 1,
  },
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
    paddingVertical: 0, // Remove default padding
    textAlign: "left",
    letterSpacing: 0.5,
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
  forgotPassword: {
    fontFamily: "Inter-Medium",
    color: "#E5E5E5",
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
    textAlign: "center",
    marginTop: 24,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
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

