// src/theme/color.ts
import { DefaultTheme } from '@react-navigation/native';

export const CinderOrange = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF8C00',
    background: '#FFFFFF',
    card: '#FFF5E6',
    text: '#333333',
    border: '#FFDAB9',
    notification: '#FF4500',
  },
};

export const CinderDark = {
  colors: {
    background: '#121212',      // Deep Charcoal
    cardSurface: '#1E1E1E',     // Slightly lighter for inputs/cards
    emberGold: '#FFB74D',       // The glow (Light Amber)
    fireOrange: '#E65100',      // Deep burnt orange for the 'C'
    textWhite: '#F5F5F5',       // Soft White
    textGrey: '#A0A0A0',        // Subtitles
    border: '#333333',          // Subtle borders
  }
};