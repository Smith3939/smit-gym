import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AuroraBackground from '../components/AuroraBackground';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import {
  getPublicProfile, getUserPosts, sendBuddyRequest, getMyBuddyLinks,
} from '../services/socialService';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - SPACING.md * 2 - 4) / 3;

export default function PublicProfileScreen({ navigation, route }) {
  const { uid } = route.params;
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [buddyState, setBuddyState] = useState('none');
  const [loading, setLoading] = useState(true);

  const isMe = uid === user?.uid;

  useEffect(() => {
    (async () => {
      try {
        const [p, userPosts, links] = await Promise.all([
          getPublicProfile(uid),
          getUserPosts(uid),
          isMe ? Promise.resolve([]) : getMyBuddyLinks(user.uid),
        ]);
        setProfile(p);
        setPosts(userPosts);
        const link = links.find(
          (l) => (l.fromUid === uid || l.toUid === uid) && l.status !== 'declined'
        );
        setBuddyState(link ? (link.status === 'accepted' ? 'accepted' : 'pending') : 'none');
      } catch (e) {
        console.log('Profile load error:', e);
      }
      setLoading(false);
    })();
  }, [uid]);

  const handleRequestBuddy = async () => {
    try {
      const res = await sendBuddyRequest(
        {
          uid: user.uid,
          name: userProfile?.name || user?.displayName || 'מתאמן',
          photo: userProfile?.photo || null,
        },
        { uid, name: profile?.name }
      );
      setBuddyState(res.alreadyExists ? res.status === 'accepted' ? 'accepted' : 'pending' : 'pending');
      toast.success(res.alreadyExists ? 'כבר קיימת בקשה בינכם' : 'הבקשה נשלחה! 💪');
    } catch (e) {
      toast.error('שליחת הבקשה נכשלה');
    }
  };

  const photoPosts = posts.filter((p) => p.image);
  const textPosts = posts.filter((p) => !p.image);

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.45} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פרופיל</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !profile ? (
        <View style={styles.loadingWrap}>
          <MaterialIcons name="person-off" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>הפרופיל לא נמצא</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile hero */}
          <GlassCard
            style={styles.heroCard}
            gradientColors={['rgba(255,77,143,0.18)', 'rgba(167,139,250,0.1)']}
            borderColor="rgba(255,77,143,0.3)"
          >
            <View style={styles.heroInner}>
              <Avatar photo={profile.photo} size={88} />
              <Text style={styles.name}>{profile.name || 'מתאמן'}</Text>
              {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

              <View style={styles.metaRow}>
                {!!profile.gymName && (
                  <View style={styles.metaChip}>
                    <MaterialIcons name="fitness-center" size={13} color={COLORS.primary} />
                    <Text style={styles.metaChipText}>{profile.gymName}</Text>
                  </View>
                )}
                {!!profile.city && (
                  <View style={styles.metaChip}>
                    <MaterialIcons name="location-on" size={13} color={COLORS.secondary} />
                    <Text style={styles.metaChipText}>{profile.city}</Text>
                  </View>
                )}
                {!!profile.goal && (
                  <View style={styles.metaChip}>
                    <MaterialIcons name="flag" size={13} color={COLORS.tertiary} />
                    <Text style={styles.metaChipText}>
                      {{ cut: 'חיטוב', bulk: 'מסה', maintain: 'שמירה' }[profile.goal] || profile.goal}
                    </Text>
                  </View>
                )}
              </View>

              {!isMe && (
                <TouchableOpacity
                  style={[
                    styles.buddyBtn,
                    buddyState === 'accepted' && styles.buddyBtnAccepted,
                    buddyState === 'pending' && styles.buddyBtnPending,
                  ]}
                  disabled={buddyState !== 'none'}
                  onPress={handleRequestBuddy}
                >
                  <MaterialIcons
                    name={buddyState === 'accepted' ? 'check' : 'group-add'}
                    size={18}
                    color={buddyState === 'accepted' ? COLORS.success : buddyState === 'pending' ? COLORS.textMuted : COLORS.text}
                  />
                  <Text style={[
                    styles.buddyBtnText,
                    buddyState === 'accepted' && { color: COLORS.success },
                    buddyState === 'pending' && { color: COLORS.textMuted },
                  ]}>
                    {{ none: 'בקש אימון משותף', pending: 'בקשה ממתינה', accepted: 'חברי אימון' }[buddyState]}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>

          {/* Photo grid */}
          {photoPosts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>תמונות</Text>
              <View style={styles.grid}>
                {photoPosts.map((p) => (
                  <Image key={p.id} source={{ uri: p.image }} style={styles.gridImage} />
                ))}
              </View>
            </>
          )}

          {/* Recent posts */}
          {textPosts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>פוסטים אחרונים</Text>
              {textPosts.slice(0, 10).map((p) => (
                <GlassCard key={p.id} style={styles.postCard} noAnimation>
                  {!!p.text && <Text style={styles.postText}>{p.text}</Text>}
                  {p.type === 'workout' && p.payload && (
                    <Text style={styles.postPayload}>
                      🏋️ שיתף אימון: {(p.payload.exercises || []).length} תרגילים
                    </Text>
                  )}
                  {p.type === 'meal' && p.payload && (
                    <Text style={styles.postPayload}>
                      🍽️ שיתף תפריט: {p.payload.calories} קלוריות
                    </Text>
                  )}
                </GlassCard>
              ))}
            </>
          )}

          {posts.length === 0 && (
            <View style={styles.emptyPosts}>
              <MaterialIcons name="photo-library" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>אין עדיין פוסטים</Text>
            </View>
          )}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: '800',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  content: {
    padding: SPACING.md,
  },

  heroCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroInner: {
    alignItems: 'center',
  },
  name: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: '900',
    marginTop: SPACING.sm,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  metaChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    fontWeight: '600',
  },
  buddyBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 999,
    marginTop: SPACING.md,
  },
  buddyBtnAccepted: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
  },
  buddyBtnPending: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buddyBtnText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: FONTS.medium,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridImage: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: BORDER_RADIUS.sm,
  },

  postCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  postText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    textAlign: 'right',
    lineHeight: 20,
  },
  postPayload: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
});
