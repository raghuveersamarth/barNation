import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';

export default function DraggableModal({ visible, onClose, children }) {
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow downward drag
      const newTranslateY = startY.value + event.translationY;
      translateY.value = Math.max(0, newTranslateY);
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 150 || event.velocityY > 500;
      
      if (shouldClose) {
        // Animate out and close
        translateY.value = withSpring(1000, {}, (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
      } else {
        // Snap back to original position
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset position when modal opens
  React.useEffect(() => {
    if (visible) {
      translateY.value = 0;
      startY.value = 0;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContent, animatedStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#141414', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '80%', 
    padding: 20 
  },
});
