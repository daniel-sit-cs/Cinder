// src/theme/colors.js
import { DefaultTheme } from '@react-navigation/native';

export const CinderOrange = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF8C00',    // Bright Orange for buttons/links
    background: '#FFFFFF', // Clean white background
    card: '#FFF5E6',       // Very light orange for Headers/Tabs
    text: '#333333',       // Dark grey for readability
    border: '#FFDAB9',     // Peach tint for subtle lines
    notification: '#FF4500', // Red-Orange for badges
  },
};