import React, { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Animated, StatusBar, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { ChevronLeft, Mail, Lock, ArrowRight, Check } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme/tokens';

export function Signup() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  const handleSignup = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let msg = 'An error occurred.';
      if (error.code === 'auth/email-already-in-use') msg = 'That email is already in use.';
      else if (error.code === 'auth/weak-password') msg = 'Password must be at least 6 characters.';
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrong = password.length >= 6;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={colors.textSecondary} size={20} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Start telling stories with AI</Text>
          </View>

          {/* Perks */}
          <View style={styles.perks}>
            {[
              'Generate up to 15 frames per story',
              'IP-Adapter character consistency',
              'Cinematic video compilation',
            ].map(perk => (
              <View key={perk} style={styles.perkRow}>
                <View style={styles.perkCheck}>
                  <Check color={colors.accent} size={12} strokeWidth={3} />
                </View>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
              <Mail color={focused === 'email' ? colors.accent : colors.textMuted} size={18} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {/* Password */}
            <View>
              <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
                <Lock color={focused === 'password' ? colors.accent : colors.textMuted} size={18} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                {passwordStrong && (
                  <View style={styles.validBadge}>
                    <Check color="#fff" size={10} strokeWidth={3} />
                  </View>
                )}
              </View>
              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${Math.min((password.length / 12) * 100, 100)}%`, backgroundColor: passwordStrong ? colors.cyan : colors.warning }]} />
                </View>
              )}
            </View>

            {/* Submit */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.btn, (!email || !password || loading) && styles.btnDisabled]}
                onPress={handleSignup}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={!email || !password || loading}
                activeOpacity={1}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Create Account</Text>
                    <ArrowRight color="#fff" size={18} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Switch to Login */}
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.switchText}>Sign in to existing account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.sm },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xl },
  backText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  header: { marginBottom: spacing.lg },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },

  perks: {
    gap: 10, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center',
  },
  perkText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

  form: { gap: spacing.sm },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.cardBorder,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  inputWrapFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary },
  validBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center',
  },

  strengthBar: {
    height: 3, backgroundColor: colors.surface,
    borderRadius: 2, marginTop: 6, overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, padding: 18, borderRadius: radius.md, marginTop: spacing.xs,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  dividerText: { fontSize: 13, color: colors.textMuted },

  switchBtn: {
    padding: 16, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  switchText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});
