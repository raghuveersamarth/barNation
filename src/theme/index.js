import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';

// Main theme object
const theme = {
  colors,
  typography,
  spacing,
  shadows,
  
  // Component themes
  components: {
    button: {
      primary: {
        backgroundColor: colors.neonCyan,
        color: colors.textDark,
        ...typography.textStyles.button,
        ...shadows.button,
        borderRadius: spacing.borderRadius['3xl'],
        paddingHorizontal: spacing.padding.lg,
        paddingVertical: spacing.padding.md,
      },
      secondary: {
        backgroundColor: colors.neonGreen,
        color: colors.textDark,
        ...typography.textStyles.button,
        ...shadows.button,
        borderRadius: spacing.borderRadius['3xl'],
        paddingHorizontal: spacing.padding.lg,
        paddingVertical: spacing.padding.md,
      },
      danger: {
        backgroundColor: colors.error,
        color: colors.textPrimary,
        ...typography.textStyles.button,
        ...shadows.button,
        borderRadius: spacing.borderRadius['3xl'],
        paddingHorizontal: spacing.padding.lg,
        paddingVertical: spacing.padding.md,
      },
      disabled: {
        backgroundColor: colors.buttonDisabled,
        color: colors.textMuted,
        ...typography.textStyles.button,
        ...shadows.none,
        borderRadius: spacing.borderRadius['3xl'],
        paddingHorizontal: spacing.padding.lg,
        paddingVertical: spacing.padding.md,
      },
    },
    
    input: {
      default: {
        backgroundColor: colors.surfaceElevated,
        color: colors.textSecondary,
        ...typography.textStyles.body,
        ...shadows.input,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: spacing.borderWidth.base,
        borderColor: colors.borderLight,
        paddingHorizontal: spacing.padding.md,
        paddingVertical: spacing.padding.md,
      },
      focus: {
        backgroundColor: colors.surfaceElevated,
        color: colors.textSecondary,
        ...typography.textStyles.body,
        ...shadows.inputFocus,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: spacing.borderWidth.thick,
        borderColor: colors.neonGreen,
        paddingHorizontal: spacing.padding.md,
        paddingVertical: spacing.padding.md,
      },
    },
    
    card: {
      default: {
        backgroundColor: colors.surface,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: spacing.borderWidth.base,
        borderColor: colors.border,
        padding: spacing.padding.md,
        ...shadows.card,
      },
      elevated: {
        backgroundColor: colors.surface,
        borderRadius: spacing.borderRadius.lg,
        borderWidth: spacing.borderWidth.base,
        borderColor: colors.border,
        padding: spacing.padding.md,
        ...shadows.cardHover,
      },
    },
    
    container: {
      screen: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.screen.padding,
      },
      section: {
        marginBottom: spacing.section.marginBottom,
      },
    },
  },
};

export default theme;
export { colors, typography, spacing, shadows };
