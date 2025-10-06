// src/screens/shared/ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      setUserProfile(profile);
      setEditForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        gender: profile.gender || "",
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      Alert.alert("Missing Info", "Name is required");
      return;
    }

    if (!editForm.age.trim() || isNaN(parseInt(editForm.age))) {
      Alert.alert("Invalid Age", "Please enter a valid age");
      return;
    }

    if (!editForm.gender) {
      Alert.alert("Missing Info", "Please select gender");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: editForm.name.trim(),
          age: parseInt(editForm.age),
          gender: editForm.gender,
        })
        .eq("id", user.id);

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully");
      setEditing(false);
      await loadUserData(); // Refresh data
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // In a real app, you'd want to handle this on the backend
              // to properly clean up all related data
              await supabase.auth.admin.deleteUser(user.id);
              Alert.alert("Account Deleted", "Your account has been deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <Text style={styles.headerSubtitle}>
          {userProfile?.role === "coach" ? "Coach Account" : "Lifter Account"}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.name?.[0]?.toUpperCase() || "U"}
            </Text>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.name}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, name: text })
                  }
                  placeholder="Full Name"
                  placeholderTextColor="#737373"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AGE</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.age}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, age: text })
                  }
                  placeholder="Age"
                  placeholderTextColor="#737373"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GENDER</Text>
                <View style={styles.genderButtons}>
                  {["male", "female", "other"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.genderButton,
                        editForm.gender === option && styles.genderButtonActive,
                      ]}
                      onPress={() =>
                        setEditForm({ ...editForm, gender: option })
                      }
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          editForm.gender === option &&
                            styles.genderButtonTextActive,
                        ]}
                      >
                        {option.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? "SAVING..." : "SAVE CHANGES"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditing(false);
                    setEditForm({
                      name: userProfile.name || "",
                      age: userProfile.age?.toString() || "",
                      gender: userProfile.gender || "",
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userProfile?.name || "No Name"}
              </Text>
              <Text style={styles.profileEmail}>{userProfile?.email}</Text>
              <Text style={styles.profileMeta}>
                {userProfile?.age ? `${userProfile.age} years` : "Age not set"}{" "}
                •
                {userProfile?.gender
                  ? ` ${userProfile.gender}`
                  : " Gender not set"}
              </Text>

              {userProfile?.role === "coach" && (
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionLabel}>SUBSCRIPTION</Text>
                  <Text style={styles.subscriptionTier}>
                    {userProfile?.subscription_tier?.toUpperCase() || "FREE"}
                  </Text>
                  <Text style={styles.subscriptionStatus}>
                    Status: {userProfile?.subscription_status || "inactive"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.editButtonText}>EDIT PROFILE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT INFO</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>
              {userProfile?.role === "coach" ? "Coach" : "Lifter"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {userProfile?.created_at
                ? new Date(userProfile.created_at).toLocaleDateString()
                : "Unknown"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user?.id}</Text>
          </View>
        </View>
        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIONS</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <Text style={styles.actionButtonText}>SIGN OUT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              DELETE ACCOUNT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    paddingVertical: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
    backgroundColor: "#0a0a0a",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00ff41",
    letterSpacing: 3,
    textShadowColor: "#00ff41",
    textShadowRadius: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#737373",
    marginTop: 4,
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  profileSection: {
    paddingVertical: 24,
    alignItems: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#141414",
    borderWidth: 3,
    borderColor: "#00ff41",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00ff41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 15,
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#00ff41",
    textShadowColor: "#00ff41",
    textShadowRadius: 15,
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#00ff41",
    letterSpacing: 1,
  },
  profileEmail: {
    marginTop: 4,
    color: "#737373",
    fontSize: 14,
  },
  profileMeta: {
    marginTop: 8,
    fontSize: 14,
    color: "#a3a3a3",
  },
  subscriptionInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  subscriptionLabel: {
    fontSize: 12,
    color: "#737373",
    letterSpacing: 2,
  },
  subscriptionTier: {
    marginTop: 4,
    fontSize: 20,
    color: "#00ff41",
    fontWeight: "700",
  },
  subscriptionStatus: {
    fontSize: 14,
    color: "#a3a3a3",
    marginTop: 2,
  },
  editButton: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 30,
    backgroundColor: "#00ff41",
    shadowColor: "#00ff41",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  editButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  editForm: {
    width: "100%",
    maxWidth: 340,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#737373",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    color: "#eaffd0",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#262626",
  },
  genderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#262626",
    marginHorizontal: 4,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: "rgba(0, 255, 65, 0.12)",
    borderColor: "#00ff41",
    shadowColor: "#00ff41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  genderButtonText: {
    color: "#737373",
    fontWeight: "700",
    letterSpacing: 1,
  },
  genderButtonTextActive: {
    color: "#00ff41",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: "#00ff41",
    borderRadius: 36,
    paddingVertical: 14,
    paddingHorizontal: 30,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    shadowColor: "#00ff41",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 15,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: "#404040",
    borderRadius: 36,
    paddingVertical: 14,
    paddingHorizontal: 30,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#737373",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  sectionTitle: {
    color: "#00ff41",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    color: "#737373",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.8,
  },
  infoValue: {
    color: "#a3a3a3",
    fontSize: 14,
  },
  actionButton: {
    paddingVertical: 14,
    backgroundColor: "#00ff41",
    borderRadius: 36,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00ff41",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 15,
  },
  actionButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },
  deleteButton: {
    backgroundColor: "#660000",
    shadowColor: "#ff0000",
    shadowOpacity: 0.9,
  },
  deleteButtonText: {
    color: "#ffb3b3",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#00ff41",
    fontSize: 18,
    fontWeight: "700",
  },
});
