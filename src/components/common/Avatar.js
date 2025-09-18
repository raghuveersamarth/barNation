// src/components/common/Avatar.js
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function Avatar({ uri, size = 64 }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00ff41',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#262626',
  },
});
