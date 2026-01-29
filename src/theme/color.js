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