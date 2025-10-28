// src/components/AppText.js
import React from "react";
import { Text } from "react-native";

export default function AppText({ style, children, ...props }) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: "Orbitron_700Bold" }, style]}
    >
      {children}
    </Text>
  );
}
