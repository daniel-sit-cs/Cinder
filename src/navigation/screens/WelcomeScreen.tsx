import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame } from 'lucide-react-native';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function WelcomeScreen({ onLogin, onSignup }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Background Image Area */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1653053151840-a35f2002a2fd?q=80&w=1080' }} 
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient Overlay Simulation */}
        <View style={styles.overlay} />
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Flame color="#FF4500" size={48} />
          <Text style={styles.title}>Welcome to CinderAI</Text>
          <Text style={styles.subtitle}>Transform your ideas into visual stories with the power of AI</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onSignup}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={onLogin}>
            <Text style={styles.secondaryBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageContainer: { flex: 1, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }, // Darken image
  
  content: { padding: 24, paddingBottom: 40, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#fff', marginTop: -30 },
  header: { alignItems: 'flex-start', marginBottom: 40, paddingTop: 30 },
  title: { fontSize: 32, fontWeight: '700', color: '#111', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
  
  actions: { gap: 12 },
  primaryBtn: { backgroundColor: '#FF4500', padding: 18, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  secondaryBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryBtnText: { color: '#111', fontSize: 16, fontWeight: '600' }
});