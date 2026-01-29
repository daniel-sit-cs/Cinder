// src/navigation/screens/Editor.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  FlatList, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { CinderOrange } from '../../theme/color';
import { generateStory } from '../../api/storyService';
import { Frame } from '../../types/story';

export function Editor() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setFrames([]); // Clear old story

    try {
      // Call our new Python backend
      const result = await generateStory(prompt);
      setFrames(result.frames);
    } catch (error: any) {
      Alert.alert("Connection Error", "Ensure the backend is running and your IP in storyService.ts is correct.\n\n" + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFrame = ({ item }: { item: Frame }) => (
    <View style={styles.card}>
      {/* 1. Visual Component */}
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.image} 
        resizeMode="cover" 
      />
      {/* 2. Narrative Component */}
      <View style={styles.textContainer}>
        <Text style={styles.frameLabel}>Frame {item.index + 1}</Text>
        <Text style={styles.narration}>{item.narration}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      {/* Input Zone */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Describe your story:</Text>
        <TextInput 
          style={styles.input}
          placeholder="A brave robot exploring a neon city..."
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: CinderOrange.colors.primary }]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✨ Generate Storyboard</Text>}
        </TouchableOpacity>
      </View>

      {/* Output Zone */}
      <FlatList
        data={frames}
        keyExtractor={(item) => item.index.toString()}
        renderItem={renderFrame}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Your story frames will appear here.</Text> : null}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  inputContainer: { padding: 20, backgroundColor: '#fff', elevation: 4 },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
  input: { backgroundColor: '#F0F0F0', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 15 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', marginBottom: 20, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  image: { width: '100%', height: 200, backgroundColor: '#eee' },
  textContainer: { padding: 15 },
  frameLabel: { color: '#FF8C00', fontWeight: 'bold', marginBottom: 4 },
  narration: { fontSize: 16, lineHeight: 22, color: '#444' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});