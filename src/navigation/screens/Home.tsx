import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  TextInput, SafeAreaView, Alert, StatusBar, Animated, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Home as HomeIcon, BookOpen, User, Search, LogOut, Crown, ChevronRight, Trash2, Film, Sparkles } from 'lucide-react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { colors, radius, spacing, font } from '../../theme/tokens';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm) / 2;

// ── Animated press card ──────────────────────────────────────────────────────
function PressCard({ onPress, children, style }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={press} onPressOut={release} onPress={onPress}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function Home() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Creator';
  const email = user?.email || '';

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => b.createdAt - a.createdAt);
      setProjects(data);
    } catch (e) { console.error(e); }
  }, [user]);

  useEffect(() => { fetchProjects(); }, [activeTab, fetchProjects]);

  const handleDelete = (projectId: string, title: string) => {
    Alert.alert(
      'Delete Story',
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'projects', projectId));
              setProjects(prev => prev.filter(p => p.id !== projectId));
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  // ── Masonry grid helpers ──────────────────────────────────────────────────
  const leftCol = projects.filter((_, i) => i % 2 === 0);
  const rightCol = projects.filter((_, i) => i % 2 !== 0);

  const renderCard = (project: any, idx: number, colIndex: number) => {
    // Stagger heights: left col alternates 160/200, right col alternates 200/160
    const imgH = (colIndex === 0 ? idx % 2 === 0 : idx % 2 !== 0) ? 160 : 200;
    return (
      <PressCard
        key={project.id}
        style={styles.gridCard}
        onPress={() => navigation.navigate('ProjectDetail', { project })}
      >
        <View style={[styles.gridImageWrap, { height: imgH }]}>
          <Image source={{ uri: project.frames?.[0]?.imageUrl }} style={styles.gridImage} />
          {/* Gradient scrim simulation */}
          <View style={styles.scrim} />
          <View style={styles.scrimContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>{project.title}</Text>
            <Text style={styles.cardDate}>{project.date}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(project.id, project.title)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 color={colors.error} size={14} />
          </TouchableOpacity>
        </View>
      </PressCard>
    );
  };

  const renderGrid = (filtered: any[]) => {
    const left = filtered.filter((_, i) => i % 2 === 0);
    const right = filtered.filter((_, i) => i % 2 !== 0);
    return (
      <View style={styles.masonryRow}>
        <View style={styles.masonryCol}>{left.map((p, i) => renderCard(p, i, 0))}</View>
        <View style={styles.masonryCol}>{right.map((p, i) => renderCard(p, i, 1))}</View>
      </View>
    );
  };

  // ── HOME TAB ────────────────────────────────────────────────────────────────
  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>Hey, {displayName}</Text>
          <Text style={styles.greetingSub}>What story will you tell today?</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Film color={colors.accent} size={40} />
          </View>
          <Text style={styles.emptyTitle}>Your stories begin here</Text>
          <Text style={styles.emptySub}>Create your first AI storyboard</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Editor')}>
            <Sparkles color="#fff" size={16} />
            <Text style={styles.emptyBtnText}>Create First Storyboard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gridSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Your Stories</Text>
            <Text style={styles.count}>{projects.length} total</Text>
          </View>
          {renderGrid(projects)}
        </View>
      )}
    </ScrollView>
  );

  // ── LIBRARY TAB ─────────────────────────────────────────────────────────────
  const renderLibrary = () => {
    const filtered = projects.filter(p =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Library</Text>
          <View style={styles.searchRow}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stories..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <BookOpen color={colors.accent} size={36} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No results found' : 'Library is empty'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery ? 'Try a different search' : 'Generated stories will appear here'}
              </Text>
            </View>
          ) : (
            renderGrid(filtered)
          )}
        </ScrollView>
      </View>
    );
  };

  // ── PROFILE TAB ─────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{projects.length}</Text>
            <Text style={styles.statLabel}>Stories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{projects.reduce((acc: number, p: any) => acc + (p.frames?.length || 0), 0)}</Text>
            <Text style={styles.statLabel}>Frames</Text>
          </View>
        </View>
      </View>

      <PressCard
        style={styles.proCard}
        onPress={() => Alert.alert('Coming Soon', 'Cinder Pro will be available soon!')}
      >
        <View style={styles.proCardInner}>
          <View style={styles.proIconWrap}>
            <Crown color={colors.warning} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.proTitle}>Upgrade to Pro</Text>
            <Text style={styles.proSub}>Unlimited AI generations · Priority queue</Text>
          </View>
          <ChevronRight color={colors.textMuted} size={18} />
        </View>
      </PressCard>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <LogOut color={colors.error} size={18} />
            <Text style={[styles.menuLabel, { color: colors.error }]}>Log Out</Text>
          </View>
          <ChevronRight color={colors.textMuted} size={16} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'library' && renderLibrary()}
        {activeTab === 'profile' && renderProfile()}
      </View>

      {/* FAB — always visible on home/library */}
      {(activeTab === 'home' || activeTab === 'library') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Editor')}
          activeOpacity={0.85}
        >
          <Plus color="#fff" size={26} />
        </TouchableOpacity>
      )}

      {/* Bottom nav — frosted glass simulation */}
      <View style={styles.bottomNav}>
        <NavTab icon={HomeIcon} label="Home" active={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <NavTab icon={BookOpen} label="Library" active={activeTab === 'library'} onPress={() => setActiveTab('library')} />
        <NavTab icon={User} label="Profile" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

const NavTab = ({ icon: Icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.navTab} onPress={onPress} activeOpacity={0.7}>
    <Icon color={active ? colors.accent : colors.textMuted} size={20} strokeWidth={active ? 2.2 : 1.8} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 120 },

  // Home header
  homeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  greeting: { ...font.section, color: colors.textPrimary },
  greetingSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.accentMuted, borderWidth: 1.5, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 16 },

  // Grid
  gridSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...font.title, color: colors.textPrimary },
  count: { fontSize: 13, color: colors.textMuted },

  masonryRow: { flexDirection: 'row', gap: spacing.sm },
  masonryCol: { flex: 1, gap: spacing.sm },
  gridCard: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  gridImageWrap: { position: 'relative', borderRadius: radius.lg, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulate gradient with a bottom overlay
  },
  scrimContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#FFF', lineHeight: 16 },
  cardDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(13,13,15,0.75)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accentMuted, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { ...font.title, color: colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: radius.full, marginTop: spacing.sm,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Library
  pageHeader: { padding: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { ...font.section, color: colors.textPrimary, marginBottom: spacing.sm },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  gridContent: { padding: spacing.lg, paddingBottom: 120 },

  // Profile
  profileHero: {
    alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder, marginBottom: spacing.lg,
  },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accentMuted, borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  profileAvatarText: { color: colors.accent, fontSize: 32, fontWeight: '700' },
  profileName: { ...font.title, color: colors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: colors.textMuted },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.lg },
  stat: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.accent },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statDivider: { width: 1, height: 32, backgroundColor: colors.cardBorder },

  proCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  proCardInner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder,
  },
  proIconWrap: {
    width: 42, height: 42, borderRadius: radius.sm,
    backgroundColor: 'rgba(245,166,35,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  proTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  proSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menuSection: { paddingHorizontal: spacing.lg },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  menuLabel: { fontSize: 16, color: colors.textPrimary },

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: spacing.lg,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },

  // Bottom nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 12, paddingBottom: 20,
    backgroundColor: 'rgba(13,13,15,0.92)',
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  navTab: { alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  navLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted },
  navLabelActive: { color: colors.accent },
});
