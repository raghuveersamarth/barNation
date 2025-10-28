import { StatusBar } from 'expo-status-bar';
import "./global.css";
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts, Orbitron_400Regular, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import useCustomFonts from './expo-font';

export default function App() {
  const [fontsLoaded, fontError] = useCustomFonts();

  if (!fontsLoaded && !fontError) {
    return null; // or a loading spinner
  }

  return (
    <>
      <AppNavigator style={{ fontFamily: "Orbitron_700Bold", fontSize: 24 }}/>
      <StatusBar style="light" />
    </>
  );
}
