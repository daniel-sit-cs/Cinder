import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Film } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme/tokens';

export function ProjectDetail() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { project } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.textSecondary} size={22} />
          <Text style={styles.backText}>Library</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Film size={14} color={colors.accent} />
          <Text style={styles.headerStyle}>{project.style}</Text>
        </View>
      </View>

      <FlatList
        data={project.frames}
        keyExtractor={(_: any, i: number) => i.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.projectDate}>{project.date} · {project.frames?.length} frames</Text>
          </View>
        }
        renderItem={({ item, index }: { item: any; index: number }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.frameLabel}>Frame {index + 1}</Text>
            </View>
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            </View>
            <View style={styles.narrationBox}>
              <Text style={styles.narration}>{item.narration}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerStyle: { fontSize: 13, color: colors.accent, fontWeight: '600' },

  list: { padding: spacing.lg, paddingBottom: 60 },

  projectInfo: { marginBottom: spacing.lg },
  projectTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  projectDate: { fontSize: 13, color: colors.textMuted },

  card: { marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  frameLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  imageWrap: {
    height: 220, borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: 10,
  },
  image: { width: '100%', height: '100%' },

  narrationBox: {
    padding: spacing.md, backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  narration: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
});
