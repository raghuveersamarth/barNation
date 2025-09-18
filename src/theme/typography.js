import { colors } from './colors';

export const typography = {
  // Font Families
  fontFamily: {
    primary: 'System', // Will use system default
    secondary: 'System',
    mono: 'Courier New',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Text Styles
  textStyles: {
    // Headers
    h1: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.neonGreen,
      letterSpacing: 1,
      textShadowColor: '#222',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    
    // Body Text
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      color: colors.textSecondary,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: 'normal',
      color: colors.textTertiary,
      lineHeight: 20,
    },
    
    // Labels
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    
    // Buttons
    button: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textDark,
      letterSpacing: 1,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textDark,
      letterSpacing: 0.5,
    },
    
    // Captions
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
      color: colors.textMuted,
      lineHeight: 16,
    },
    
    // Special
    neon: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.neonGreen,
      letterSpacing: 1,
      textShadowColor: colors.neonGreen,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    error: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.error,
    },
    success: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.success,
    },
  },
};

export default typography;
