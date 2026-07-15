import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AuroraBackground from '../components/AuroraBackground';
import GlassCard from '../components/GlassCard';
import Avatar from '../components/Avatar';
import { FadeInView } from '../components/AnimatedCard';
import {
  getFeedPosts, createPost, deletePost, toggleLike, getLikeInfo,
  getAllPublicProfiles, upsertPublicProfile, sendBuddyRequest,
  getIncomingRequests, getMyBuddyLinks, respondToBuddyRequest,
  pickAndCompressImage, getCurrentLocation, distanceKm,
} from '../services/socialService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return '';
  const diff = Date.now() / 1000 - timestamp.seconds;
  if (diff < 60) return 'עכשיו';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק'`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שע'`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

// ─── Post card ──────────────────────────────────────────────────────────────

function PostCard({ post, myUid, onOpenProfile, onDeleted }) {
  const [likeInfo, setLikeInfo] = useState({ count: 0, isLiked: false });
  const toast = useToast();

  useEffect(() => {
    getLikeInfo(post.id, myUid).then(setLikeInfo).catch(() => {});
  }, [post.id]);

  const handleLike = async () => {
    // Optimistic update
    setLikeInfo((p) => ({
      count: p.count + (p.isLiked ? -1 : 1),
      isLiked: !p.isLiked,
    }));
    try {
      await toggleLike(post.id, myUid);
    } catch (e) {
      toast.error('הלייק לא נשמר');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      onDeleted(post.id);
      toast.success('הפוסט נמחק');
    } catch (e) {
      toast.error('מחיקה נכשלה');
    }
  };

  return (
    <GlassCard style={styles.postCard} noAnimation>
      {/* Author row */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postAuthor}
          onPress={() => onOpenProfile(post.uid)}
          activeOpacity={0.8}
        >
          <Avatar photo={post.authorPhoto} size={42} />
          <View style={styles.postAuthorText}>
            <Text style={styles.postAuthorName}>{post.authorName || 'מתאמן'}</Text>
            <Text style={styles.postMeta}>
              {post.authorGym ? `${post.authorGym} · ` : ''}{timeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        {post.uid === myUid && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="delete-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Text */}
      {!!post.text && <Text style={styles.postText}>{post.text}</Text>}

      {/* Shared workout payload */}
      {post.type === 'workout' && post.payload && (
        <View style={styles.payloadCard}>
          <View style={styles.payloadHeader}>
            <MaterialIcons name="fitness-center" size={16} color={COLORS.primary} />
            <Text style={styles.payloadTitle}>{post.payload.name || 'האימון שלי'}</Text>
          </View>
          {(post.payload.exercises || []).slice(0, 6).map((ex, i) => (
            <Text key={i} style={styles.payloadItem}>
              • {ex.name} — {ex.sets}×{ex.reps}
            </Text>
          ))}
          {(post.payload.exercises || []).length > 6 && (
            <Text style={styles.payloadMore}>
              +{post.payload.exercises.length - 6} תרגילים נוספים
            </Text>
          )}
        </View>
      )}

      {/* Shared meal payload */}
      {post.type === 'meal' && post.payload && (
        <View style={[styles.payloadCard, { borderColor: 'rgba(52,211,153,0.3)' }]}>
          <View style={styles.payloadHeader}>
            <MaterialIcons name="restaurant" size={16} color={COLORS.success} />
            <Text style={styles.payloadTitle}>התפריט שלי · {post.payload.calories} קל'</Text>
          </View>
          <Text style={styles.payloadItem}>
            חלבון {post.payload.protein}ג · פחמ' {post.payload.carbs}ג · שומן {post.payload.fat}ג
          </Text>
          {(post.payload.meals || []).map((m, i) => (
            <Text key={i} style={styles.payloadItem}>• {m}</Text>
          ))}
        </View>
      )}

      {/* Image */}
      {!!post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={handleLike}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={likeInfo.isLiked ? 'favorite' : 'favorite-border'}
            size={22}
            color={likeInfo.isLiked ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.likeCount, likeInfo.isLiked && { color: COLORS.primary }]}>
            {likeInfo.count > 0 ? likeInfo.count : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

// ─── Person card (discover) ─────────────────────────────────────────────────

function PersonCard({ person, buddyState, distance, onOpenProfile, onRequestBuddy }) {
  const buddyLabel = {
    none: 'אימון משותף?',
    pending: 'ממתין...',
    accepted: 'חברים 💪',
  }[buddyState];

  return (
    <GlassCard style={styles.personCard} noAnimation>
      <TouchableOpacity
        style={styles.personMain}
        onPress={() => onOpenProfile(person.uid)}
        activeOpacity={0.8}
      >
        <Avatar photo={person.photo} size={52} />
        <View style={styles.personText}>
          <Text style={styles.personName}>{person.name || 'מתאמן'}</Text>
          <Text style={styles.personMeta} numberOfLines={1}>
            {[person.gymName, person.city].filter(Boolean).join(' · ') || 'ללא פרטים'}
          </Text>
          {distance != null && (
            <View style={styles.distanceBadge}>
              <MaterialIcons name="near-me" size={11} color={COLORS.secondary} />
              <Text style={styles.distanceText}>
                {distance < 1 ? 'פחות מק"מ' : `${distance.toFixed(1)} ק"מ`} ממך
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.buddyBtn,
          buddyState === 'accepted' && styles.buddyBtnAccepted,
          buddyState === 'pending' && styles.buddyBtnPending,
        ]}
        disabled={buddyState !== 'none'}
        onPress={() => onRequestBuddy(person)}
      >
        <Text style={[
          styles.buddyBtnText,
          buddyState === 'accepted' && { color: COLORS.success },
          buddyState === 'pending' && { color: COLORS.textMuted },
        ]}>
          {buddyLabel}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('feed'); // 'feed' | 'people'
  const [posts, setPosts] = useState([]);
  const [people, setPeople] = useState([]);
  const [requests, setRequests] = useState([]);
  const [buddyLinks, setBuddyLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Composer state
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState(null);
  const [posting, setPosting] = useState(false);

  // People filter
  const [peopleFilter, setPeopleFilter] = useState('all'); // all | gym | city | near
  const [myLocation, setMyLocation] = useState(null);

  const myName = userProfile?.name || user?.displayName || 'מתאמן';
  const myPhoto = userProfile?.photo || null;

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const [feedData, peopleData, reqData, linksData] = await Promise.all([
        getFeedPosts(),
        getAllPublicProfiles(),
        getIncomingRequests(user.uid),
        getMyBuddyLinks(user.uid),
      ]);
      setPosts(feedData);
      setPeople(peopleData.filter((p) => p.uid !== user.uid));
      setRequests(reqData);
      setBuddyLinks(linksData);
    } catch (e) {
      console.log('Community load error:', e);
      toast.error('טעינת הקהילה נכשלה');
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePost = async () => {
    if (!composerText.trim() && !composerImage) return;
    setPosting(true);
    try {
      await createPost({
        uid: user.uid,
        authorName: myName,
        authorPhoto: myPhoto,
        authorGym: userProfile?.gymName || null,
        text: composerText.trim(),
        image: composerImage,
        type: 'text',
        payload: null,
      });
      setComposerText('');
      setComposerImage(null);
      toast.success('הפוסט פורסם! 🎉');
      loadAll();
    } catch (e) {
      toast.error('הפרסום נכשל, נסה שוב');
    }
    setPosting(false);
  };

  const handlePickImage = async () => {
    const img = await pickAndCompressImage();
    if (img) setComposerImage(img);
  };

  const handleShareLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      if (!loc) {
        toast.info('לא ניתנה הרשאת מיקום');
        return;
      }
      setMyLocation(loc);
      await upsertPublicProfile(user.uid, { location: loc });
      setPeopleFilter('near');
      toast.success('המיקום שותף - מציג מתאמנים קרובים');
    } catch (e) {
      toast.error('שיתוף המיקום נכשל');
    }
  };

  const handleRequestBuddy = async (person) => {
    try {
      const res = await sendBuddyRequest(
        { uid: user.uid, name: myName, photo: myPhoto },
        { uid: person.uid, name: person.name }
      );
      if (res.alreadyExists) {
        toast.info('כבר קיימת בקשה בינכם');
      } else {
        toast.success(`נשלחה בקשת אימון משותף ל${person.name || 'מתאמן'} 💪`);
      }
      setBuddyLinks((prev) => [...prev, {
        fromUid: user.uid, toUid: person.uid, status: res.status,
      }]);
    } catch (e) {
      toast.error('שליחת הבקשה נכשלה');
    }
  };

  const handleRespond = async (req, status) => {
    try {
      await respondToBuddyRequest(req.id, status);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setBuddyLinks((prev) => prev.map((l) =>
        l.id === req.id ? { ...l, status } : l
      ));
      toast.success(status === 'accepted' ? `אתם חברי אימון! 💪` : 'הבקשה נדחתה');
    } catch (e) {
      toast.error('הפעולה נכשלה');
    }
  };

  const buddyStateFor = (uid) => {
    const link = buddyLinks.find(
      (l) => (l.fromUid === uid || l.toUid === uid) && l.status !== 'declined'
    );
    if (!link) return 'none';
    return link.status === 'accepted' ? 'accepted' : 'pending';
  };

  const openProfile = (uid) => navigation.navigate('PublicProfile', { uid });

  // People filtering
  const effectiveLocation = myLocation || userProfile?.location || null;
  const filteredPeople = people
    .map((p) => ({ ...p, distance: distanceKm(effectiveLocation, p.location) }))
    .filter((p) => {
      if (peopleFilter === 'gym') {
        return userProfile?.gymName && p.gymName &&
          p.gymName.trim() === userProfile.gymName.trim();
      }
      if (peopleFilter === 'city') {
        return userProfile?.city && p.city &&
          p.city.trim() === userProfile.city.trim();
      }
      if (peopleFilter === 'near') return p.distance != null && p.distance <= 25;
      return true;
    })
    .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));

  const filters = [
    { id: 'all', label: 'הכל', icon: 'public' },
    { id: 'gym', label: 'החדר שלי', icon: 'fitness-center' },
    { id: 'city', label: 'העיר שלי', icon: 'location-city' },
    { id: 'near', label: 'קרובים אליי', icon: 'near-me' },
  ];

  return (
    <View style={styles.root}>
      <AuroraBackground intensity={0.45} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={{ width: 40 }} />
          <Text style={styles.title}>קהילה</Text>
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="groups" size={24} color={COLORS.primary} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, tab === 'people' && styles.segmentActive]}
            onPress={() => setTab('people')}
          >
            <Text style={[styles.segmentText, tab === 'people' && styles.segmentTextActive]}>
              אנשים {requests.length > 0 ? `(${requests.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, tab === 'feed' && styles.segmentActive]}
            onPress={() => setTab('feed')}
          >
            <Text style={[styles.segmentText, tab === 'feed' && styles.segmentTextActive]}>
              פיד
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadAll(); }}
                tintColor={COLORS.primary}
              />
            }
          >
            {tab === 'feed' ? (
              <>
                {/* Composer */}
                <GlassCard style={styles.composer} noAnimation>
                  <View style={styles.composerRow}>
                    <Avatar photo={myPhoto} size={40} />
                    <TextInput
                      style={styles.composerInput}
                      placeholder="מה קורה באימון? שתף את הקהילה..."
                      placeholderTextColor={COLORS.textMuted}
                      value={composerText}
                      onChangeText={setComposerText}
                      multiline
                      textAlign="right"
                    />
                  </View>
                  {composerImage && (
                    <View style={styles.composerImageWrap}>
                      <Image source={{ uri: composerImage }} style={styles.composerImage} />
                      <TouchableOpacity
                        style={styles.composerImageRemove}
                        onPress={() => setComposerImage(null)}
                      >
                        <MaterialIcons name="close" size={16} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.composerActions}>
                    <TouchableOpacity
                      style={[styles.publishBtn, (!composerText.trim() && !composerImage) && { opacity: 0.5 }]}
                      onPress={handlePost}
                      disabled={posting || (!composerText.trim() && !composerImage)}
                    >
                      {posting ? (
                        <ActivityIndicator size="small" color={COLORS.text} />
                      ) : (
                        <Text style={styles.publishBtnText}>פרסם</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePickImage} style={styles.imageBtn}>
                      <MaterialIcons name="photo-camera" size={22} color={COLORS.secondary} />
                      <Text style={styles.imageBtnText}>תמונה</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>

                {/* Posts */}
                {posts.length === 0 ? (
                  <FadeInView style={styles.emptyState}>
                    <MaterialIcons name="forum" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>עדיין אין פוסטים</Text>
                    <Text style={styles.emptySubtext}>היה הראשון לשתף את האימון שלך!</Text>
                  </FadeInView>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      myUid={user.uid}
                      onOpenProfile={openProfile}
                      onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                    />
                  ))
                )}
              </>
            ) : (
              <>
                {/* Incoming buddy requests */}
                {requests.length > 0 && (
                  <GlassCard
                    style={styles.requestsCard}
                    gradientColors={['rgba(255,77,143,0.2)', 'rgba(167,139,250,0.1)']}
                    borderColor="rgba(255,77,143,0.35)"
                    noAnimation
                  >
                    <Text style={styles.requestsTitle}>בקשות אימון משותף 🔥</Text>
                    {requests.map((req) => (
                      <View key={req.id} style={styles.requestRow}>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() => handleRespond(req, 'accepted')}
                          >
                            <Text style={styles.acceptBtnText}>אשר</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.declineBtn}
                            onPress={() => handleRespond(req, 'declined')}
                          >
                            <Text style={styles.declineBtnText}>דחה</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.requestPerson}>
                          <Text style={styles.requestName}>{req.fromName || 'מתאמן'}</Text>
                          <Avatar photo={req.fromPhoto} size={36} />
                        </View>
                      </View>
                    ))}
                  </GlassCard>
                )}

                {/* Location prompt */}
                {!effectiveLocation && (
                  <TouchableOpacity onPress={handleShareLocation} activeOpacity={0.85}>
                    <GlassCard
                      style={styles.locationPrompt}
                      gradientColors={['rgba(34,211,238,0.18)', 'rgba(167,139,250,0.08)']}
                      borderColor="rgba(34,211,238,0.35)"
                      noAnimation
                    >
                      <View style={styles.locationPromptInner}>
                        <MaterialIcons name="my-location" size={24} color={COLORS.secondary} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.locationPromptTitle}>מי מתאמן לידך?</Text>
                          <Text style={styles.locationPromptText}>
                            שתף מיקום כדי לראות מתאמנים בסביבה שלך
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-left" size={22} color={COLORS.secondary} />
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                )}

                {/* Filter chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {filters.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.filterChip, peopleFilter === f.id && styles.filterChipActive]}
                      onPress={() => {
                        if (f.id === 'near' && !effectiveLocation) {
                          handleShareLocation();
                        } else {
                          setPeopleFilter(f.id);
                        }
                      }}
                    >
                      <MaterialIcons
                        name={f.icon}
                        size={15}
                        color={peopleFilter === f.id ? COLORS.primary : COLORS.textMuted}
                      />
                      <Text style={[
                        styles.filterChipText,
                        peopleFilter === f.id && { color: COLORS.primary },
                      ]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* People list */}
                {filteredPeople.length === 0 ? (
                  <FadeInView style={styles.emptyState}>
                    <MaterialIcons name="person-search" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>
                      {peopleFilter === 'gym' && !userProfile?.gymName
                        ? 'הוסף את חדר הכושר שלך בפרופיל'
                        : 'לא נמצאו מתאמנים'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {peopleFilter === 'all'
                        ? 'הזמן חברים להצטרף לאפליקציה!'
                        : 'נסה סינון אחר'}
                    </Text>
                  </FadeInView>
                ) : (
                  filteredPeople.map((person) => (
                    <PersonCard
                      key={person.uid}
                      person={person}
                      distance={person.distance}
                      buddyState={buddyStateFor(person.uid)}
                      onOpenProfile={openProfile}
                      onRequestBuddy={handleRequestBuddy}
                    />
                  ))
                )}
              </>
            )}

            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  title: {
    color: COLORS.text,
    fontSize: FONTS.xlarge,
    fontWeight: '800',
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentRow: {
    flexDirection: 'row-reverse',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.primary + '25',
  },
  segmentText: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: COLORS.primary,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.xs,
  },

  // Composer
  composer: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  composerRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  composerInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.regular,
    minHeight: 44,
    maxHeight: 120,
    paddingTop: SPACING.sm,
  },
  composerImageWrap: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  composerImage: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.md,
  },
  composerImageRemove: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  imageBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.xs,
  },
  imageBtnText: {
    color: COLORS.secondary,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
  },
  publishBtnText: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
  },

  // Posts
  postCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  postAuthorText: {
    alignItems: 'flex-end',
  },
  postAuthorName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '700',
  },
  postMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 1,
  },
  postText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    lineHeight: 22,
    textAlign: 'right',
    marginTop: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  postActions: {
    flexDirection: 'row-reverse',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  likeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    fontWeight: '700',
  },

  // Payload cards (shared workout/meal)
  payloadCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,77,143,0.3)',
  },
  payloadHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  payloadTitle: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '800',
  },
  payloadItem: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    textAlign: 'right',
    lineHeight: 20,
  },
  payloadMore: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },

  // People
  personCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  personMain: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  personText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  personName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '700',
  },
  personMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    backgroundColor: 'rgba(34,211,238,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  distanceText: {
    color: COLORS.secondary,
    fontSize: FONTS.micro,
    fontWeight: '700',
  },
  buddyBtn: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  buddyBtnAccepted: {
    borderColor: 'rgba(52,211,153,0.5)',
    backgroundColor: 'rgba(52,211,153,0.1)',
  },
  buddyBtnPending: {
    borderColor: COLORS.border,
  },
  buddyBtnText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: '700',
  },

  // Requests
  requestsCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  requestsTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: SPACING.sm,
  },
  requestRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  requestPerson: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  requestName: {
    color: COLORS.text,
    fontSize: FONTS.small,
    fontWeight: '700',
  },
  requestActions: {
    flexDirection: 'row-reverse',
    gap: SPACING.sm,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  acceptBtnText: {
    color: COLORS.text,
    fontSize: FONTS.tiny,
    fontWeight: '800',
  },
  declineBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  declineBtnText: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },

  // Location prompt
  locationPrompt: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  locationPromptInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  locationPromptTitle: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: '800',
    textAlign: 'right',
  },
  locationPromptText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.tiny,
    textAlign: 'right',
    marginTop: 2,
  },

  // Filters
  filterRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary + '50',
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: FONTS.tiny,
    fontWeight: '700',
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
    marginTop: SPACING.xs,
  },
});
