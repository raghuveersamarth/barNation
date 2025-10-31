import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { typography } from "../../theme/typography";
import {
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons"; // For the icons
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";

// --- Animated Touchable Component ---
// This lets us animate the TouchableOpacity border and shadow colors
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

// Colors matching the design (tuned for stronger vibrancy)
const ORANGE = "#FF7A1A"; // slightly brighter orange
const ORANGE_DEEP = "#FF4F00";
const GREY = "#6e6e6e";
const LIGHT_GREY = "#E0E0E0";
const DARK_BG = "rgba(20, 20, 20, 0.45)"; // more translucent so background shows
const DARKER_BG = "rgba(0, 0, 0, 0.24)"; // light overlay on top of blur

export default function RoleSelectionScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState("lifter");

  // --- Animation Hooks ---
  const onLoadAnim = useSharedValue(0); // For fade-in
  const selectionAnim = useSharedValue(selectedRole === "lifter" ? 1 : 0); // 1 = lifter, 0 = coach

  // On-Load Animation
  useEffect(() => {
    onLoadAnim.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  // Animate selection change
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    selectionAnim.value = withTiming(role === "lifter" ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  // --- Animated Styles ---

  // Main container fade-in
  const containerStyle = useAnimatedStyle(() => ({
    opacity: onLoadAnim.value,
    transform: [
      {
        translateY: (1 - onLoadAnim.value) * 20,
      },
    ],
  }));

  // --- LIFTER Card Styles ---
  const lifterCardStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      selectionAnim.value,
      [0, 1],
      [GREY, ORANGE]
    );
    return {
      borderColor,
      borderWidth: selectionAnim.value === 1 ? 2 : 1,
      shadowColor: selectionAnim.value === 1 ? ORANGE : "#000",
      shadowOpacity: selectionAnim.value === 1 ? 0.7 : 0.4,
      shadowRadius: selectionAnim.value === 1 ? 15 : 8,
    };
  });
  const lifterIconColor = useAnimatedStyle(() => ({
    color: interpolateColor(selectionAnim.value, [0, 1], [LIGHT_GREY, ORANGE]),
  }));

  // --- COACH Card Styles ---
  const coachCardStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      selectionAnim.value,
      [0, 1],
      [ORANGE, GREY]
    );
    return {
      borderColor,
      borderWidth: selectionAnim.value === 0 ? 2 : 1,
      shadowColor: selectionAnim.value === 0 ? ORANGE : "#000",
      shadowOpacity: selectionAnim.value === 0 ? 0.7 : 0.4,
      shadowRadius: selectionAnim.value === 0 ? 15 : 8,
    };
  });
  const coachIconColor = useAnimatedStyle(() => ({
    color: interpolateColor(selectionAnim.value, [0, 1], [ORANGE, LIGHT_GREY]),
  }));

  // --- Button Press Animation ---
  const buttonScale = useSharedValue(1);
  const animatedButton = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onPressIn = () => {
    buttonScale.value = withTiming(0.98, { duration: 100 });
  };
  const onPressOut = () => {
    buttonScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../../../assets/role_selection.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
    <BlurView intensity={40} tint="dark" style={styles.blurView}>
          <Animated.View style={[styles.contentContainer, containerStyle]}>
            <Text style={styles.logo}>BarNation</Text>
            <Text style={styles.headline}>DEFINE YOUR{'\n'}STANCE</Text>

            <View style={styles.cardContainer}>
              {/* LIFTER Card */}
              <AnimatedTouchableOpacity
                style={[styles.card, lifterCardStyle]}
                onPress={() => handleSelectRole("lifter")}
                activeOpacity={0.9}
              >
                <Animated.View style={lifterIconColor}>
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={52}
                    color={selectedRole === 'lifter' ? ORANGE : LIGHT_GREY}
                  />
                </Animated.View>
                <Text style={styles.cardTitle}>LIFTER</Text>
                <Text style={styles.cardSubtitle}>
                  Forge Your Body. Track Your Ascent.
                </Text>
              </AnimatedTouchableOpacity>

              {/* COACH Card */}
              <AnimatedTouchableOpacity
                style={[styles.card, coachCardStyle]}
                onPress={() => handleSelectRole("coach")}
                activeOpacity={0.9}
              >
                <Animated.View style={coachIconColor}>
                  <FontAwesome5
                    name="handshake"
                    size={52}
                    color={selectedRole === 'coach' ? ORANGE : LIGHT_GREY}
                  />
                </Animated.View>
                <Text style={styles.cardTitle}>COACH</Text>
                <Text style={styles.cardSubtitle}>
                  Guide The Tribe. Build Legacies.
                </Text>
              </AnimatedTouchableOpacity>
            </View>

            <AnimatedTouchableOpacity
              style={[styles.button, animatedButton]}
              activeOpacity={1}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() =>
                navigation.navigate("ProfileSetup", { role: selectedRole })
              }
            >
              <LinearGradient
                colors={[ORANGE, ORANGE_DEEP]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <Text style={styles.buttonText}>PROCEED</Text>
              </LinearGradient>
            </AnimatedTouchableOpacity>
          </Animated.View>
        </BlurView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: "#121212",
  },
  blurView: {
    flex: 1,
    // keep blur visible but don't fully darken the image
    backgroundColor: DARKER_BG,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    fontFamily: typography.fontFamily.primaryBold,
    color: ORANGE,
    fontSize: 24,
    letterSpacing: 1,
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
  },
  headline: {
    fontFamily: typography.fontFamily.primaryBold,
    fontSize: 42,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 3,
    lineHeight: 52,
    textAlign: "center",
    marginBottom: 48,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 380,
    marginBottom: 48,
  },
  card: {
    width: "48%",
    aspectRatio: 0.75,
    backgroundColor: DARK_BG,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderWidth: 1,
    borderColor: GREY,
    // subtle elevated look so background remains visible
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardTitle: {
    fontFamily: typography.fontFamily.primaryBold,
    fontSize: 20,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    width: "100%",
    maxWidth: 380,
    marginTop: 48,
    borderRadius: 50, // Pill shape
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: ORANGE_DEEP,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 28,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  buttonText: {
    fontFamily: typography.fontFamily.primaryBold,
    color: "#FFFFFF",
    fontSize: 18,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});

