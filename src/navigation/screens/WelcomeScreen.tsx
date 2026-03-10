import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Film, Sparkles } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme/tokens';

const { width, height } = Dimensions.get('window');

// Decorative film strip column
function FilmStrip({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={[styles.filmStrip, side === 'right' && styles.filmStripRight]}>
      {Array.from({ length: 18 }).map((_, i) => (
        <View key={i} style={styles.filmHole} />
      ))}
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<any>();

  // Entrance animation
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const sheetY     = useRef(new Animated.Value(80)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 10 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(sheetY,      { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(sheetOpacity,{ toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ── Hero area ─────────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Ghost watermark */}
        <Text style={styles.watermark} numberOfLines={1}>CINDER</Text>

        {/* Film strips */}
        <FilmStrip side="left" />
        <FilmStrip side="right" />

        {/* Decorative corner dots */}
        <View style={[styles.cornerDot, styles.cornerTL]} />
        <View style={[styles.cornerDot, styles.cornerTR]} />
        <View style={[styles.cornerDot, styles.cornerBL]} />
        <View style={[styles.cornerDot, styles.cornerBR]} />

        {/* Central logo */}
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoRing}>
            <View style={styles.logoRingInner}>
              <Film color={colors.accent} size={36} strokeWidth={1.5} />
            </View>
          </View>
          <Text style={styles.appName}>Cinder</Text>
          <View style={styles.tagRow}>
            <Sparkles color={colors.accent} size={12} />
            <Text style={styles.tagText}>AI Storyboard Studio</Text>
            <Sparkles color={colors.accent} size={12} />
          </View>
        </Animated.View>

        {/* Feature pills */}
        <View style={styles.featurePills}>
          {['IP-Adapter', 'Cinematic Video', 'Character Consistency'].map(f => (
            <View key={f} style={styles.pill}>
              <Text style={styles.pillText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Action sheet ──────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { opacity: sheetOpacity, transform: [{ translateY: sheetY }] }]}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Start creating stories</Text>
          <Text style={styles.sheetSub}>
            Turn your ideas into cinematic storyboards with AI-generated frames and narration.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get Started — It's Free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Hero
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    fontSize: 120,
    fontWeight: '900',
    color: '#fff',
    opacity: 0.025,
    letterSpacing: -4,
    width: width + 40,
    textAlign: 'center',
  },

  // Film strips
  filmStrip: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 28, paddingVertical: 20,
    alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.04)',
  },
  filmStripRight: {
    left: undefined, right: 0,
    borderRightWidth: 0,
    borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.04)',
  },
  filmHole: {
    width: 12, height: 10, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Corner dots
  cornerDot: {
    position: 'absolute', width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accent, opacity: 0.4,
  },
  cornerTL: { top: 32, left: 44 },
  cornerTR: { top: 32, right: 44 },
  cornerBL: { bottom: 32, left: 44 },
  cornerBR: { bottom: 32, right: 44 },

  // Logo
  logoWrap: { alignItems: 'center', gap: 16 },
  logoRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1, borderColor: colors.accentDim,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(124,92,252,0.06)',
  },
  logoRingInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1.5,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagText: { fontSize: 13, color: colors.accent, fontWeight: '600', letterSpacing: 1 },

  // Feature pills
  featurePills: {
    position: 'absolute', bottom: spacing.lg,
    flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
    paddingHorizontal: 40,
  },
  pill: {
    backgroundColor: 'rgba(124,92,252,0.12)',
    borderWidth: 1, borderColor: colors.accentDim,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.full,
  },
  pillText: { fontSize: 11, color: colors.accent, fontWeight: '600' },

  // Sheet
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.cardBorder,
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 22, fontWeight: '700', color: colors.textPrimary,
    marginBottom: 8,
  },
  sheetSub: {
    fontSize: 14, color: colors.textSecondary, lineHeight: 22,
    marginBottom: spacing.lg,
  },

  // Buttons
  actions: { gap: 10, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: colors.accent, padding: 18, borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: 'transparent', padding: 16, borderRadius: radius.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },

  disclaimer: {
    fontSize: 11, color: colors.textMuted, textAlign: 'center',
    lineHeight: 16, paddingBottom: 8,
  },
});
