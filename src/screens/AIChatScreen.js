import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { sendMessageToAI, isAIConnected } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/AuroraBackground';

const AI_LIVE = isAIConnected();

const INITIAL_MESSAGE = {
  id: '1',
  role: 'assistant',
  content: 'שלום! אני המאמן AI שלך 💪\n\nאני יכול לעזור לך עם:\n• הצעות לתרגילים חלופיים\n• החלפת מזונות בתפריט\n• שאלות על תזונה וכושר\n• טיפים לאימון\n\nמה תרצה לדעת?',
};

export default function AIChatScreen() {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  const quickQuestions = [
    'איזה תרגיל חלופי לבאנצ פרס?',
    'מה אפשר לאכול במקום אורז?',
    'כמה חלבון אני צריך ביום?',
    'תכנית אימונים לחיטוב',
  ];

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(
        updatedMessages.filter((m) => m.id !== '1'),
        userProfile
      );
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'מצטער, הייתה בעיה. נסה שוב 🙏',
      }]);
    }
    setIsLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AuroraBackground intensity={0.4} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.tertiary, COLORS.secondary]}
          style={styles.headerIconBg}
        >
          <MaterialIcons name="auto-awesome" size={22} color={COLORS.textOnColor} />
        </LinearGradient>
        <Text style={styles.title}>המאמן AI שלך</Text>
        {AI_LIVE ? (
          <View style={styles.aiStatus}>
            <View style={styles.aiStatusDot} />
            <Text style={styles.aiStatusText}>חי</Text>
          </View>
        ) : (
          <View style={styles.aiStatusOffline}>
            <Text style={styles.aiStatusOfflineText}>בסיסי</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <MaterialIcons
                name="smart-toy"
                size={16}
                color={COLORS.primary}
                style={styles.aiIcon}
              />
            )}
            <Text style={[
              styles.messageText,
              msg.role === 'user' ? styles.userText : styles.aiText,
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>חושב...</Text>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.quickQuestions}>
            {quickQuestions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickQuestionButton}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickQuestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={inputText.trim() ? COLORS.primary : COLORS.textMuted}
            style={{ transform: [{ scaleX: -1 }] }}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="שאל שאלה..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage(inputText)}
        />
      </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  aiStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  aiStatusText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
  },
  aiStatusOffline: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiStatusOfflineText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: SPACING.xs,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: SPACING.xs,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  aiIcon: {
    marginTop: 2,
  },
  messageText: {
    fontSize: FONTS.regular,
    lineHeight: 24,
    textAlign: 'right',
    flex: 1,
  },
  userText: {
    color: COLORS.text,
  },
  aiText: {
    color: COLORS.text,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  quickQuestions: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  quickQuestionButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  quickQuestionText: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.regular,
    textAlign: 'right',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
});
