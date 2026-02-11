import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, SafeAreaView, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Plus, Home as HomeIcon, Library, User, Clock, Search, 
  Settings, Bell, HelpCircle, LogOut, Crown, ChevronRight 
} from 'lucide-react-native';

// --- MOCK DATA ---
const RECENT_PROJECTS = [
  { id: 1, title: 'The Cyberpunk Fox', date: '2h ago', image: 'https://via.placeholder.com/150/FF4500/FFFFFF?text=Fox' },
  { id: 2, title: 'Neon City', date: '5h ago', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=City' },
  { id: 3, title: 'Ancient Ruins', date: '1d ago', image: 'https://via.placeholder.com/150/333/FFFFFF?text=Ruins' },
];

export function Home() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'library' | 'profile'
  const [searchQuery, setSearchQuery] = useState('');

  // --- VIEW 1: DASHBOARD ---
  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back, User</Text>
        <Text style={styles.subGreeting}>Ready to create something amazing?</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.newStoryBtn}
          onPress={() => navigation.navigate('Editor')}
          activeOpacity={0.9}
        >
          <Plus color="#fff" size={24} />
          <Text style={styles.newStoryText}>New Story</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          <TouchableOpacity onPress={() => setActiveTab('library')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.projectList}>
          {RECENT_PROJECTS.slice(0, 2).map((project) => (
            <TouchableOpacity key={project.id} style={styles.projectCard}>
              <Image source={{ uri: project.image }} style={styles.projectImage} />
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <View style={styles.metaRow}>
                  <Clock size={12} color="#666" />
                  <Text style={styles.projectDate}>{project.date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // --- VIEW 2: LIBRARY ---
  const renderLibrary = () => {
    const filtered = RECENT_PROJECTS.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <View style={{flex: 1}}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Library</Text>
          <View style={styles.searchBox}>
             <Search size={20} color="#9CA3AF" />
             <TextInput 
               style={styles.searchInput} 
               placeholder="Search storyboards..." 
               value={searchQuery}
               onChangeText={setSearchQuery}
             />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.gridContent}>
          {filtered.length === 0 ? (
             <View style={styles.emptyState}>
                <Library color="#ccc" size={48} />
                <Text style={[styles.emptyTitle, {marginTop: 16}]}>No stories found</Text>
             </View>
          ) : (
             <View style={styles.grid}>
               {filtered.map((project) => (
                 <TouchableOpacity key={project.id} style={styles.gridCard}>
                    <Image source={{ uri: project.image }} style={styles.gridImage} />
                    <View style={styles.gridInfo}>
                       <Text style={styles.gridTitle} numberOfLines={1}>{project.title}</Text>
                       <Text style={styles.gridDate}>{project.date}</Text>
                    </View>
                 </TouchableOpacity>
               ))}
             </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // --- VIEW 3: PROFILE ---
  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Profile</Text>
      </View>
      
      <View style={styles.profileHeader}>
         <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
         <View>
            <Text style={styles.profileName}>User Name</Text>
            <Text style={styles.profileEmail}>user@example.com</Text>
         </View>
      </View>

      <View style={styles.section}>
         <TouchableOpacity style={styles.proCard}>
            <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
               <Crown color="#fff" size={24} />
               <View>
                  <Text style={{color:'#fff', fontWeight:'700', fontSize: 16}}>Upgrade to Pro</Text>
                  <Text style={{color:'rgba(255,255,255,0.9)', fontSize: 12}}>Unlimited generations</Text>
               </View>
            </View>
            <ChevronRight color="#fff" size={20} />
         </TouchableOpacity>
      </View>

      <View style={styles.menuList}>
         <MenuItem icon={Settings} label="Settings" />
         <MenuItem icon={Bell} label="Notifications" />
         <MenuItem icon={HelpCircle} label="Help & Support" />
         <MenuItem icon={LogOut} label="Log Out" color="#EF4444" />
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{flex: 1}}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'library' && renderLibrary()}
        {activeTab === 'profile' && renderProfile()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TabItem icon={HomeIcon} label="Home" active={activeTab === 'home'} onPress={() => setActiveTab('home')} />
        <TabItem icon={Library} label="Library" active={activeTab === 'library'} onPress={() => setActiveTab('library')} />
        <TabItem icon={User} label="Profile" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

// --- SUB COMPONENTS ---
const TabItem = ({ icon: Icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Icon color={active ? '#FF4500' : '#9CA3AF'} size={24} />
    <Text style={[styles.tabLabel, { color: active ? '#FF4500' : '#9CA3AF' }]}>{label}</Text>
  </TouchableOpacity>
);

const MenuItem = ({ icon: Icon, label, color = '#374151' }: any) => (
  <TouchableOpacity style={styles.menuItem}>
     <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
        <Icon color={color} size={20} />
        <Text style={{fontSize: 16, color: color}}>{label}</Text>
     </View>
     <ChevronRight color="#D1D5DB" size={20} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 30 },
  header: { padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  greeting: { fontSize: 24, fontWeight: '700', color: '#111' },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111' },

  scrollContent: { paddingBottom: 100 },
  section: { padding: 24, paddingBottom: 0 },
  
  newStoryBtn: {
    backgroundColor: '#FF4500', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 20, borderRadius: 14, gap: 12, elevation: 4
  },
  newStoryText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  seeAll: { color: '#FF4500', fontSize: 14, fontWeight: '500' },

  // Library Styles
  searchBox: { flexDirection: 'row', alignItems:'center', backgroundColor:'#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, borderWidth:1, borderColor:'#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  gridContent: { padding: 24, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  gridImage: { width: '100%', height: 100, backgroundColor: '#eee' },
  gridInfo: { padding: 10 },
  gridTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  gridDate: { fontSize: 12, color: '#6B7280' },
  emptyState: { alignItems:'center', marginTop: 60 },
  emptyTitle: { color: '#9CA3AF', fontSize: 16 },

  // Profile Styles
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF4500', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileEmail: { color: '#6B7280' },
  proCard: { backgroundColor: '#FF4500', padding: 20, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuList: { padding: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

  // Project List (Home)
  projectList: { gap: 12 },
  projectCard: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', gap: 16 },
  projectImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#F3F4F6' },
  projectInfo: { flex: 1, justifyContent: 'center' },
  projectTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  projectDate: { fontSize: 12, color: '#6B7280' },

  // Navigation
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  tabItem: { alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 10, fontWeight: '500' }
});