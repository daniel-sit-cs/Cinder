// src/navigation/screens/Home.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { CinderOrange } from '../../theme/color';

export function Home({ navigation }: any) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to Cinder</Text>
      <Text style={styles.subtitle}>Ready to bring your story to life?</Text>

      {/* Main Action - Storyboard Creator */}
      <TouchableOpacity 
        style={[styles.mainButton, { backgroundColor: CinderOrange.colors.primary }]}
        onPress={() => navigation.navigate('Editor')}
      >
        <Text style={styles.buttonText}>+ Start New Story</Text>
      </TouchableOpacity>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40, marginTop: 10 },
  mainButton: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { marginTop: 50 },
  logoutText: { color: '#FF4500', fontWeight: '600' }
});