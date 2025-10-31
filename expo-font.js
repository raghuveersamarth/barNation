import { useFonts } from 'expo-font';

export default function useCustomFonts() {
  const [fontsLoaded, fontError] = useFonts({
    'Orbitron-Regular': require('./assets/fonts/Orbitron-VariableFont_wght.ttf'),
    'Orbitron-Medium': require('./assets/fonts/Orbitron-VariableFont_wght.ttf'),
    'Orbitron-Bold': require('./assets/fonts/Orbitron-VariableFont_wght.ttf'),
    'Inter-Regular': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
  });

  return [fontsLoaded, fontError];
}
