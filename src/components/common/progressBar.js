// src/components/common/ProgressBar.js
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function ProgressBar({ progress = 0, height = 12 }) {
  const widthAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View style={[styles.fill, { width: widthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
      }) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#262626',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    backgroundColor: '#00ff41',
    height: '100%',
  },
});
