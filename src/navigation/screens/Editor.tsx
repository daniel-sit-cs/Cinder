// src/navigation/screens/Editor.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Editor() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storyboard Editor</Text>
      <Text>This is where your AI-narrated visual journey begins.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 }
});