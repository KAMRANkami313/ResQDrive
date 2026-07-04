import { lightColors, darkColors, ThemeColors } from './colors';
import { typography, Typography } from './typography';
import { spacing, Spacing } from './spacing';
import { radii, Radii } from './radii';
import { lightShadows, darkShadows, Shadows } from './shadows';

export interface Theme {
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  radii: Radii;
  shadows: Shadows;
}

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  radii,
  shadows: lightShadows,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  radii,
  shadows: darkShadows,
};

export { lightColors, darkColors, typography, spacing, radii, lightShadows, darkShadows };
export type { ThemeColors, Typography, Spacing, Radii, Shadows };