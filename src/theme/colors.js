// BarNation Color Palette - Underground Streetlifting Theme
export const colors = {
  // Primary Colors
  neonGreen: '#b3ff00',
  neonCyan: '#00ffff',
  neonOrange: '#ff6b35',
  
  // Background Colors
  background: '#0b0b0b',
  surface: '#101010',
  surfaceElevated: '#181f24',
  surfaceHover: '#1a1a1a',
  
  // Text Colors
  textPrimary: '#ffffff',
  textSecondary: '#eaffd0',
  textTertiary: '#cccccc',
  textMuted: '#888888',
  textDark: '#0b0b0b',
  
  // Border Colors
  border: '#222222',
  borderLight: '#2e3a2c',
  borderNeon: '#00ff41',
  
  // Status Colors
  success: '#00ff41',
  warning: '#ff6b35',
  error: '#ff4444',
  info: '#00ffff',
  
  // Button Colors
  buttonPrimary: '#00ffff',
  buttonSecondary: '#b3ff00',
  buttonDanger: '#ff4444',
  buttonDisabled: '#00babaff',
  
  // Shadow Colors
  shadowNeon: '#00ffff',
  shadowGreen: '#b3ff00',
  shadowDark: '#000000',
  
  // Chart Colors
  chartPrimary: '#00ff41',
  chartSecondary: '#00ffff',
  chartTertiary: '#ff6b35',
  chartBackground: '#000000',
  chartGrid: '#333333',
  
  // Gradient Colors
  gradientStart: '#0b0b0b',
  gradientEnd: '#070707',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Transparent Colors
  transparent: 'transparent',
  semiTransparent: 'rgba(255, 255, 255, 0.1)',
};

// Color variations for different states
export const colorVariations = {
  neonGreen: {
    light: '#c7ff33',
    main: '#b3ff00',
    dark: '#99e600',
    alpha: (opacity) => `rgba(179, 255, 0, ${opacity})`,
  },
  neonCyan: {
    light: '#33ffff',
    main: '#00ffff',
    dark: '#00cccc',
    alpha: (opacity) => `rgba(0, 255, 255, ${opacity})`,
  },
  neonOrange: {
    light: '#ff8c5a',
    main: '#ff6b35',
    dark: '#e55a2b',
    alpha: (opacity) => `rgba(255, 107, 53, ${opacity})`,
  },
};

export default colors;
