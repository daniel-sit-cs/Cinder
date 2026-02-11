import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  FlatList, Image, ActivityIndicator, Alert, ScrollView, SafeAreaView
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Sparkles, Save, Share2 } from 'lucide-react-native';
import { generateStory, animateFrame } from '../../api/storyService';
import { Frame } from '../../types/story';

interface SmartFrame extends Frame {
  videoUrl?: string;
  isAnimating?: boolean;
}

const STYLES = ['Cinematic', 'Anime', 'Sketch', '3D Render', 'Watercolor'];

export function Editor() {
  const navigation = useNavigation();
  const [viewState, setViewState] = useState<'input' | 'loading' | 'result'>('input');
  
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  const [frameCount, setFrameCount] = useState(4);
  const [frames, setFrames] = useState<SmartFrame[]>([]);


 const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setViewState('loading');
    setFrames([]);

    try {
      // 🐛 FIX: We no longer mash the style into the prompt!
      // This stops the TTS from reading "Cinematic style..." out loud.
      const result = await generateStory(prompt, selectedStyle, frameCount);
      setFrames(result.frames);
      setViewState('result');
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setViewState('input');
    }
  };

  const handleAnimateFrame = async (index: number) => {
    const newFrames = [...frames];
    newFrames[index].isAnimating = true;
    setFrames(newFrames);

    try {
      // Pass the narration text so the AI can read it!
      const videoUrl = await animateFrame(frames[index].imageUrl, frames[index].narration); 
      newFrames[index].videoUrl = videoUrl;
    } catch (error: any) {
      Alert.alert("Animation Failed", error.message);
    } finally {
      newFrames[index].isAnimating = false;
      setFrames([...newFrames]);
    }
  };

  if (viewState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loaderCircle}>
          <ActivityIndicator size="large" color="#FF4500" />
        </View>
        <Text style={styles.loadingTitle}>Dreaming up your story...</Text>
        <Text style={styles.loadingSub}>This may take about 30 seconds</Text>
      </View>
    );
  }


  if (viewState === 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color="#000" size={24} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create Your Story</Text>
          <Text style={styles.subtitle}>Describe your vision and let AI bring it to life</Text>

          <Text style={styles.label}>Story Description</Text>
          <TextInput
            style={styles.textArea}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe your scene, characters, and mood..."
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Visual Style</Text>
          <View style={styles.styleRow}>
            {STYLES.map((style) => (
              <TouchableOpacity
                key={style}
                onPress={() => setSelectedStyle(style)}
                style={[styles.styleChip, selectedStyle === style && styles.styleChipActive]}
              >
                <Text style={[styles.styleText, selectedStyle === style && styles.styleTextActive]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Frame Count (1 to 15 Slider/Counter) */}
          <Text style={styles.label}>Frames: {frameCount}</Text>
          <View style={styles.frameCountBox}>
             <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: 20}}>
                <TouchableOpacity 
                  onPress={() => setFrameCount(Math.max(1, frameCount - 1))}
                  style={styles.frameNum}
                >
                  <Text style={{fontSize: 24, color: '#FF4500', fontWeight: 'bold'}}>-</Text>
                </TouchableOpacity>
                
                <Text style={{fontSize: 24, fontWeight: 'bold', color: '#111'}}>{frameCount}</Text>
                
                <TouchableOpacity 
                  onPress={() => setFrameCount(Math.min(15, frameCount + 1))}
                  style={styles.frameNum}
                >
                  <Text style={{fontSize: 24, color: '#FF4500', fontWeight: 'bold'}}>+</Text>
                </TouchableOpacity>
             </View>
          </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.mainBtn, !prompt.trim() && styles.disabledBtn]} 
            onPress={handleGenerate}
            disabled={!prompt.trim()}
          >
            <Sparkles color="#fff" size={20} />
            <Text style={styles.mainBtnText}>Generate Storyboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setViewState('input')} style={styles.backBtn}>
          <ChevronLeft color="#000" size={24} />
          <Text style={styles.backText}>Edit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Storyboard</Text>
        <View style={{width: 24}} /> 
      </View>

      <FlatList
        data={frames}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        renderItem={({ item, index }) => (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
               <View style={styles.frameBadge}><Text style={styles.frameBadgeText}>{index + 1}</Text></View>
               <Text style={styles.frameTitle}>Frame {index + 1}</Text>
               
               {!item.videoUrl && (
                 <TouchableOpacity 
                   onPress={() => handleAnimateFrame(index)}
                   disabled={item.isAnimating}
                   style={{marginLeft: 'auto'}}
                 >
                   <Text style={{color:'#FF4500', fontWeight:'600'}}>
                     {item.isAnimating ? 'Loading...' : '🎬 Animate'}
                   </Text>
                 </TouchableOpacity>
               )}
            </View>

            <View style={styles.mediaContainer}>
              {item.videoUrl ? (
                <Video
                  style={styles.media}
                  source={{ uri: item.videoUrl }}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  shouldPlay
                />
              ) : (
                <Image source={{ uri: item.imageUrl }} style={styles.media} />
              )}
              {item.isAnimating && (
                 <View style={styles.loadingOverlay}>
                    <ActivityIndicator color="#FF4500" />
                 </View>
              )}
            </View>

            <View style={styles.narrationBox}>
              <Text style={styles.narrationText}>{item.narration}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.mainBtn, {flex: 1}]}>
             <Save color="#fff" size={20} />
             <Text style={styles.mainBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
             <Share2 color="#000" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#111' },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  textArea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 16, height: 160, fontSize: 16, textAlignVertical: 'top' },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleChip: { borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  styleChipActive: { backgroundColor: '#FF4500', borderColor: '#FF4500' },
  styleText: { color: '#374151' },
  styleTextActive: { color: '#fff', fontWeight: '600' },
  frameCountBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  frameNum: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent:'center', borderWidth:1, borderColor:'#ddd' },
  frameNumActive: { backgroundColor: '#FF4500', borderColor: '#FF4500' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  mainBtn: { backgroundColor: '#FF4500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 14, gap: 10 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  loaderCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFE4D6', borderTopColor: '#FF4500', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  loadingTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  loadingSub: { color: '#6B7280' },
  resultCard: { marginBottom: 32 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  frameBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF4500', alignItems: 'center', justifyContent: 'center' },
  frameBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  frameTitle: { fontSize: 18, fontWeight: '600' },
  mediaContainer: { height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 16 },
  media: { width: '100%', height: '100%' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  narrationBox: { padding: 16, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  narrationText: { fontSize: 15, lineHeight: 24, color: '#374151' },
  actionRow: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 18, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }
});