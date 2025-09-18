import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/common/Button.js';

export default function VideoUploadScreen({ navigation, route }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload videos.');
        return false;
      }
    }
    return true;
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60, // 1 minute max
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video. Please try again.');
      console.error('Video picker error:', error);
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo) {
      Alert.alert('No Video', 'Please select a video first.');
      return;
    }

    setUploading(true);
    try {
      // TODO: Implement video upload logic
      // This would typically involve:
      // 1. Creating a FormData object with the video file
      // 2. Uploading to a storage service (AWS S3, Firebase Storage, etc.)
      // 3. Getting the video URL and saving it to the database
      // 4. Notifying the coach about the new video
      
      Alert.alert('Success', 'Video uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload video. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Workout Video</Text>
        <Text style={styles.subtitle}>Share your progress with your coach</Text>

        <View style={styles.videoContainer}>
          {selectedVideo ? (
            <View style={styles.selectedVideo}>
              <Text style={styles.videoText}>Video Selected:</Text>
              <Text style={styles.videoName} numberOfLines={1}>
                {selectedVideo.fileName || 'Video'}
              </Text>
              <Text style={styles.videoSize}>
                {(selectedVideo.fileSize / (1024 * 1024)).toFixed(2)} MB
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickButton} onPress={pickVideo}>
              <Text style={styles.pickButtonText}>Select Video</Text>
              <Text style={styles.pickButtonSubtext}>Tap to choose from gallery</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title={uploading ? "Uploading..." : "Upload Video"}
            onPress={uploadVideo}
            disabled={!selectedVideo || uploading}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#00ff41',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#a3a3a3',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  videoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  pickButton: {
    borderWidth: 2,
    borderColor: '#00ff41',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  pickButtonText: {
    color: '#00ff41',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pickButtonSubtext: {
    color: '#a3a3a3',
    fontSize: 14,
  },
  selectedVideo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  videoText: {
    color: '#00ff41',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  videoSize: {
    color: '#a3a3a3',
    fontSize: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
