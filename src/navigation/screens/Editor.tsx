import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator, Alert, ScrollView, StatusBar, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Sparkles, Save, Share2, ImagePlus, Check } from 'lucide-react-native';
import { generateStory } from '../../api/storyService';
import { Frame } from '../../types/story';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, font } from '../../theme/tokens';

interface SmartFrame extends Frame {
  videoUrl?: string;
}

const STYLE_OPTIONS = [
  { key: 'Cinematic',   bg: '#0D1A2E', accent: '#4A90D9', icon: '🎬' },
  { key: 'Anime',       bg: '#1A0D2E', accent: '#A855F7', icon: '✨' },
  { key: 'Watercolor',  bg: '#0D2E26', accent: '#4ECDC4', icon: '🎨' },
  { key: 'Comic Book',  bg: '#2E1A0D', accent: '#F5A623', icon: '💥' },
  { key: 'Sketch',      bg: '#1A1A1A', accent: '#A0A0A0', icon: '✏️' },
];

const LOADING_MESSAGES = [
  'Composing scenes...',
  'Painting your world...',
  'Adding cinematic lighting...',
  'Building character details...',
  'Crafting the narrative...',
  'Rendering your vision...',
  'Compiling the story...',
];

// ── Animated press wrapper ───────────────────────────────────────────────────
function PressBtn({ onPress, style, children, disabled }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => !disabled && Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={style} onPressIn={press} onPressOut={release}
        onPress={onPress} activeOpacity={1} disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Cycling loading text ─────────────────────────────────────────────────────
function CyclingText() {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setIdx(i => (i + 1) % LOADING_MESSAGES.length);
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    };
    const timer = setInterval(cycle, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <Animated.Text style={[styles.loadingMsg, { opacity }]}>
      {LOADING_MESSAGES[idx]}
    </Animated.Text>
  );
}

export function Editor() {
  const navigation = useNavigation();
  const [viewState, setViewState] = useState<'input' | 'loading' | 'result'>('input');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  const [frameCount, setFrameCount] = useState(6);
  const [frames, setFrames] = useState<SmartFrame[]>([]);
  const [storyVideoUrl, setStoryVideoUrl] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) setReferenceImage(result.assets[0].base64 || null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setViewState('loading');
    setFrames([]);
    try {
      const result = await generateStory(prompt, selectedStyle, frameCount, referenceImage);
      setFrames(result.frames);
      setStoryVideoUrl(result.videoUrl ?? null);
      setViewState('result');
    } catch (error: any) {
      Alert.alert('Generation Failed', error.message);
      setViewState('input');
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || frames.length === 0) return;
    try {
      const shortTitle = prompt.split(' ').slice(0, 4).join(' ') + '...';
      await addDoc(collection(db, 'projects'), {
        userId: auth.currentUser.uid,
        title: shortTitle,
        prompt,
        style: selectedStyle,
        frames,
        date: new Date().toLocaleDateString(),
        createdAt: new Date().getTime(),
      });
      Alert.alert('Saved!', 'Storyboard saved to your Library.', [
        { text: 'OK', onPress: () => navigation.navigate('Home' as never) }
      ]);
    } catch (error: any) {
      Alert.alert('Save Failed', error.message);
    }
  };

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (viewState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        {/* Film strip progress bar */}
        <View style={styles.filmStrip}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={styles.filmHole} />
          ))}
        </View>
        <View style={styles.loaderCircle}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
        <Text style={styles.loadingTitle}>Dreaming up your story</Text>
        <CyclingText />
        <Text style={styles.loadingHint}>This usually takes 1–2 minutes</Text>
        {/* Frame dots */}
        <View style={styles.frameDots}>
          {Array.from({ length: frameCount }).map((_, i) => (
            <View key={i} style={styles.frameDot} />
          ))}
        </View>
      </View>
    );
  }

  // ── INPUT ────────────────────────────────────────────────────────────────────
  if (viewState === 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={colors.textSecondary} size={22} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Story</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Create Your Story</Text>
          <Text style={styles.screenSub}>Describe your vision and let AI bring it to life</Text>

          {/* Story description */}
          <Text style={styles.label}>Story Description</Text>
          <TextInput
            style={styles.textArea}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="A lone astronaut discovers a hidden garden on Mars..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{prompt.length} characters</Text>

          {/* Character reference */}
          <Text style={styles.label}>
            Character Reference{' '}
            <Text style={styles.labelOptional}>— enables IP-Adapter consistency</Text>
          </Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
            {referenceImage ? (
              <>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${referenceImage}` }}
                  style={styles.previewThumb}
                />
                <View style={styles.previewBadge}>
                  <Check color="#fff" size={12} />
                </View>
              </>
            ) : (
              <View style={styles.uploadInner}>
                <View style={styles.uploadIconWrap}>
                  <ImagePlus color={colors.accent} size={22} />
                </View>
                <Text style={styles.uploadTitle}>Upload Character Image</Text>
                <Text style={styles.uploadSub}>For consistent character across frames</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Visual style */}
          <Text style={styles.label}>Visual Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }}>
            <View style={styles.styleRow}>
              {STYLE_OPTIONS.map((s) => {
                const active = selectedStyle === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSelectedStyle(s.key)}
                    style={[styles.styleCard, { backgroundColor: s.bg }, active && styles.styleCardActive]}
                    activeOpacity={0.8}
                  >
                    {active && (
                      <View style={[styles.styleCheck, { backgroundColor: s.accent }]}>
                        <Check color="#fff" size={10} />
                      </View>
                    )}
                    <Text style={styles.styleIcon}>{s.icon}</Text>
                    <Text style={[styles.styleName, active && { color: s.accent }]}>{s.key}</Text>
                    {active && (
                      <View style={[styles.styleActiveLine, { backgroundColor: s.accent }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Frame count */}
          <Text style={styles.label}>Frame Count</Text>
          <View style={styles.frameCountCard}>
            <View style={styles.frameCountRow}>
              <TouchableOpacity
                onPress={() => setFrameCount(Math.max(1, frameCount - 1))}
                style={styles.frameBtn}
              >
                <Text style={styles.frameBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.frameNumWrap}>
                <Text style={styles.frameNum}>{frameCount}</Text>
                <Text style={styles.frameNumLabel}>frames</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFrameCount(Math.min(15, frameCount + 1))}
                style={styles.frameBtn}
              >
                <Text style={styles.frameBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            {/* Film strip visualization */}
            <View style={styles.stripWrap}>
              {Array.from({ length: 15 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.stripFrame, i < frameCount && styles.stripFrameActive]}
                />
              ))}
            </View>
            <View style={styles.stripLabels}>
              <Text style={styles.stripLabel}>1</Text>
              <Text style={styles.stripLabel}>15</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PressBtn
            style={[styles.generateBtn, !prompt.trim() && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!prompt.trim()}
          >
            <Sparkles color="#fff" size={20} />
            <Text style={styles.generateBtnText}>Generate Storyboard</Text>
          </PressBtn>
        </View>
      </SafeAreaView>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setViewState('input')} style={styles.backBtn}>
          <ChevronLeft color={colors.textSecondary} size={22} />
          <Text style={styles.backText}>Edit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storyboard</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={frames}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={storyVideoUrl ? (
          <View style={styles.videoCard}>
            <View style={styles.videoHeader}>
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>FILM</Text>
              </View>
              <Text style={styles.videoTitle}>Full Story Video</Text>
            </View>
            <Video
              style={styles.video}
              source={{ uri: storyVideoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          </View>
        ) : null}
        renderItem={({ item, index }) => (
          <View style={styles.resultCard}>
            <View style={styles.resultCardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.frameTitle}>Frame {index + 1}</Text>
            </View>
            <View style={styles.mediaWrap}>
              <Image source={{ uri: item.imageUrl }} style={styles.media} />
            </View>
            <View style={styles.narrationBox}>
              <Text style={styles.narration}>{item.narration}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <PressBtn style={[styles.saveBtn, { flex: 1 }]} onPress={handleSave}>
            <Save color="#fff" size={18} />
            <Text style={styles.saveBtnText}>Save to Library</Text>
          </PressBtn>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
            <Share2 color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  headerTitle: { ...font.label, color: colors.textPrimary, textTransform: 'uppercase' },

  // Input screen
  content: { padding: spacing.lg, paddingBottom: 40 },
  screenTitle: { ...font.section, color: colors.textPrimary, marginBottom: 6 },
  screenSub: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 22 },
  label: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: spacing.lg,
  },
  labelOptional: { fontSize: 11, color: colors.accent, textTransform: 'none', letterSpacing: 0, fontWeight: '500' },
  textArea: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: radius.lg, padding: spacing.md, height: 150,
    fontSize: 16, color: colors.textPrimary, textAlignVertical: 'top', lineHeight: 24,
  },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 6 },

  // Upload
  uploadBtn: {
    backgroundColor: colors.surface, height: 110, borderRadius: radius.lg,
    borderStyle: 'dashed', borderWidth: 1.5, borderColor: colors.accentDim,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  uploadInner: { alignItems: 'center', gap: 8 },
  uploadIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  uploadSub: { fontSize: 12, color: colors.textMuted },
  previewThumb: { width: '100%', height: '100%' },
  previewBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  // Style cards
  styleRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: 4,
  },
  styleCard: {
    width: 110, height: 90, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: 'transparent', position: 'relative', overflow: 'hidden',
  },
  styleCardActive: { borderColor: colors.accent },
  styleCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  styleIcon: { fontSize: 24 },
  styleName: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  styleActiveLine: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
  },

  // Frame count
  frameCountCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  frameCountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  frameBtn: {
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
  },
  frameBtnText: { fontSize: 24, color: colors.accent, fontWeight: '600' },
  frameNumWrap: { alignItems: 'center' },
  frameNum: { fontSize: 36, fontWeight: '700', color: colors.textPrimary },
  frameNumLabel: { fontSize: 12, color: colors.textMuted, marginTop: -2 },
  stripWrap: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center' },
  stripFrame: {
    width: 14, height: 20, borderRadius: 2,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
  },
  stripFrameActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  stripLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
    paddingHorizontal: 2,
  },
  stripLabel: { fontSize: 10, color: colors.textMuted },

  // Footer
  footer: {
    padding: spacing.md, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
    backgroundColor: colors.bg,
  },
  generateBtn: {
    backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 18, borderRadius: radius.lg, gap: 10,
  },
  generateBtnDisabled: { opacity: 0.35 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: {
    backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 18, borderRadius: radius.lg, gap: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  shareBtn: {
    padding: 18, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg, padding: spacing.xl,
  },
  filmStrip: {
    flexDirection: 'row', gap: 4, marginBottom: spacing.xl,
    opacity: 0.25,
  },
  filmHole: {
    width: 12, height: 12, borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  loaderCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: colors.accentMuted, borderTopColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  loadingTitle: { ...font.section, color: colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  loadingMsg: { fontSize: 15, color: colors.accent, marginBottom: spacing.xs, textAlign: 'center' },
  loadingHint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  frameDots: {
    flexDirection: 'row', gap: 6, marginTop: spacing.lg, flexWrap: 'wrap', justifyContent: 'center',
  },
  frameDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.accentDim,
  },

  // Result cards
  resultCard: { marginBottom: spacing.lg },
  resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  frameTitle: { ...font.title, color: colors.textPrimary },
  mediaWrap: {
    height: 220, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 10,
  },
  media: { width: '100%', height: '100%' },
  narrationBox: {
    padding: spacing.md, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  narration: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },

  // Video
  videoCard: {
    marginBottom: spacing.lg, backgroundColor: colors.surface,
    borderRadius: radius.lg, overflow: 'hidden', padding: spacing.md,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  videoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  videoBadge: {
    backgroundColor: colors.accentMuted, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accentDim,
  },
  videoBadgeText: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1 },
  videoTitle: { ...font.title, color: colors.textPrimary },
  video: { width: '100%', height: 260, borderRadius: radius.md },
});
