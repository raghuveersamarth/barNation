import { StatusBar } from 'expo-status-bar';
import "./global.css";
import AppNavigator from './src/navigation/AppNavigator';
import useCustomFonts from './expo-font';

export default function App() {
  const [fontsLoaded, fontError] = useCustomFonts();

  if (!fontsLoaded && !fontError) {
    return null; // or a loading spinner
  }

  return (
    <>
      <AppNavigator/>
      <StatusBar style="light" />
    </>
  );
}
