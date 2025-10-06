// SignupScreen.js - Step 1: Basic Account Creation
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { TouchableOpacity } from "react-native";
import { supabase } from "../../services/supabase";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
            "An account with this email already exists. Please log in instead."
          );
          return;
        }
        Alert.alert("Signup Failed", error.message);
        return;
      }

      // ✅ Instead of going to RoleSelection directly:
      Alert.alert(
        "Confirm Your Email",
        "A confirmation link has been sent to your email. Please verify before logging in."
      );

      // Send them back to Login
      navigation.navigate("Login");
    } catch (err) {
      Alert.alert("Signup Failed", err.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ENTER THE</Text>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.titleGlow}>BAR</Text>
          <Text style={styles.titleGlow2}>NATION</Text>
        </View>
        <Text style={styles.subtitle}>Create your streetlifting account</Text>
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
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#737373"
        />

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#737373"
        />

        <CustomButton
          title={isLoading ? "CREATING ACCOUNT..." : "NEXT"}
          onPress={handleSignup}
          disabled={isLoading}
          variant="primary"
        />

        <CustomButton
          title="ALREADY HAVE ACCOUNT? LOGIN"
          onPress={() => navigation.navigate("Login")}
          variant="secondary"
        />
      </View>
    </View>
  );
}

// RoleSelectionScreen.js - Step 2: Choose Coach or Client
// export function RoleSelectionScreen({ navigation, route }) {
//   const { userId, email } = route.params;
//   const [selectedRole, setSelectedRole] = useState(null);

//   const handleRoleSelect = (role) => {
//     setSelectedRole(role);
//     // Navigate to profile setup with role
//     navigation.navigate('ProfileSetup', {
//       userId,
//       email,
//       role
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.titleSmall}>CHOOSE YOUR PATH</Text>
//         <Text style={styles.subtitle}>How will you dominate the BarNation?</Text>
//       </View>

//       <View style={styles.roleContainer}>
//         <TouchableOpacity
//           style={styles.roleCard}
//           onPress={() => handleRoleSelect('coach')}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.roleIcon}>💪</Text>
//           <Text style={styles.roleTitle}>COACH</Text>
//           <Text style={styles.roleDesc}>Lead lifters to greatness</Text>
//           <Text style={styles.roleFeatures}>
//             • Train multiple clients{'\n'}
//             • Track progress{'\n'}
//             • Review form videos{'\n'}
//             • Build programs
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.roleCard}
//           onPress={() => handleRoleSelect('client')}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.roleIcon}>🏋️</Text>
//           <Text style={styles.roleTitle}>LIFTER</Text>
//           <Text style={styles.roleDesc}>Master the big three</Text>
//           <Text style={styles.roleFeatures}>
//             • Follow coach programs{'\n'}
//             • Log your lifts{'\n'}
//             • Upload form checks{'\n'}
//             • Track PRs
//           </Text>
//         </TouchableOpacity>
//       </View>

//       <CustomButton
//         title="← BACK"
//         onPress={() => navigation.goBack()}
//         variant="ghost"
//       />
//     </View>
//   );
// }

// // ProfileSetupScreen.js - Step 3: Complete Profile
// export function ProfileSetupScreen({ navigation, route }) {
//   const { userId, email, role } = route.params;
//   const [name, setName] = useState('');
//   const [age, setAge] = useState('');
//   const [gender, setGender] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const handleProfileSetup = async () => {
//     if (!name || !age || !gender) {
//       Alert.alert("Missing Info", "Please fill in all fields");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       // Update user profile in Supabase
//       const { error } = await supabase
//         .from('users')
//         .upsert({
//           id: userId,
//           email: email,
//           name: name,
//           age: parseInt(age),
//           gender: gender,
//           role: role,
//           profile_complete: true,
//           created_at: new Date().toISOString(),
//         });

//       if (error) {
//         Alert.alert("Profile Setup Failed", error.message);
//         return;
//       }

//       // Navigate based on role
//       if (role === 'coach') {
//         navigation.navigate('SubscriptionSelection');
//       } else {
//         navigation.navigate('CoachConnection');
//       }

//     } catch (err) {
//       Alert.alert("Setup Failed", err.message ?? "Unknown error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.titleSmall}>
//           {role === 'coach' ? 'COACH PROFILE' : 'LIFTER PROFILE'}
//         </Text>
//         <Text style={styles.subtitle}>Tell us about yourself</Text>
//       </View>

//       <View style={styles.form}>
//         <TextInput
//           placeholder="Full Name"
//           style={styles.input}
//           value={name}
//           onChangeText={setName}
//           placeholderTextColor="#737373"
//         />

//         <TextInput
//           placeholder="Age"
//           style={styles.input}
//           value={age}
//           onChangeText={setAge}
//           keyboardType="numeric"
//           placeholderTextColor="#737373"
//         />

//         <View style={styles.genderContainer}>
//           <Text style={styles.genderLabel}>Gender:</Text>
//           <View style={styles.genderButtons}>
//             {['Male', 'Female', 'Other'].map((option) => (
//               <TouchableOpacity
//                 key={option}
//                 style={[
//                   styles.genderButton,
//                   gender === option.toLowerCase() && styles.genderButtonActive
//                 ]}
//                 onPress={() => setGender(option.toLowerCase())}
//               >
//                 <Text style={[
//                   styles.genderButtonText,
//                   gender === option.toLowerCase() && styles.genderButtonTextActive
//                 ]}>
//                   {option.toUpperCase()}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         <CustomButton
//           title={isLoading ? 'SETTING UP...' : 'COMPLETE SETUP'}
//           onPress={handleProfileSetup}
//           disabled={isLoading}
//           variant="primary"
//         />

//         <CustomButton
//           title="← BACK"
//           onPress={() => navigation.goBack()}
//           variant="ghost"
//         />
//       </View>
//     </View>
//   );
// }

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
      case "ghost":
        return [styles.button, styles.buttonGhost];
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
      case "ghost":
        return [styles.buttonText, styles.buttonTextGhost];
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
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },
  titleGlow: {
    color: "#ffffffff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "#00ff41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleGlow2: {
    color: "#00ff41",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "#00ff41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleSmall: {
    color: "#00ff41",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "#00ff41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
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
  buttonGhost: {
    backgroundColor: "transparent",
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
  buttonTextGhost: {
    color: "#737373",
  },
  roleContainer: {
    gap: 20,
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "#262626",
    alignItems: "center",
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  roleTitle: {
    color: "#00ff41",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  roleDesc: {
    color: "#d4d4d4",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  roleFeatures: {
    color: "#a3a3a3",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    color: "#d4d4d4",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  genderButtons: {
    flexDirection: "row",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#262626",
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  genderButtonActive: {
    borderColor: "#00ff41",
    backgroundColor: "rgba(0, 255, 65, 0.1)",
  },
  genderButtonText: {
    color: "#737373",
    fontSize: 12,
    fontWeight: "600",
  },
  genderButtonTextActive: {
    color: "#00ff41",
  },
});
