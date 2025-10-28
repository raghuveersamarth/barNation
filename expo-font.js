import { useFonts } from 'expo-font';

export default function useCustomFonts() {
  const [fontsLoaded, fontError] = useFonts({
    'Regular': require('./assets/fonts/Satoshi-Regular.otf'),
    // 'Bold': require('./assets/fonts/YourFont-Bold.ttf'),
    // 'Medium': require('./assets/fonts/YourFont-Medium.ttf'),
    // 'Light': require('./assets/fonts/YourFont-Light.ttf'),
  });

  return [fontsLoaded, fontError];
}
