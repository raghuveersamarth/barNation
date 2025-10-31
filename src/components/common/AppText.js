// src/components/AppText.js
import React from "react";
import { Text } from "react-native";
import { typography } from "../../theme/typography";

export default function AppText({ style, weight = "regular", children, ...props }) {
  const getFontFamily = () => {
    switch (weight) {
      case "bold":
        return typography.fontFamily.primaryBold;
      case "medium":
        return typography.fontFamily.primaryMedium;
      default:
        return typography.fontFamily.primary;
    }
  };

  return (
    <Text
      {...props}
      style={[{ fontFamily: getFontFamily() }, style]}
    >
      {children}
    </Text>
  );
}
