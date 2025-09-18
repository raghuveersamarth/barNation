import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function LoadingSpinner({ size = "large", color = "#00ff41" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
