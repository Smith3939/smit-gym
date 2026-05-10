import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';
import { sendMessageToAI } from '../services/aiService';
import { useAuth } from '../context/AuthContext';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <MaterialIcons name="smart-toy" size={28} color={COLORS.primary} />
        <Text style={styles.title}>המאמן AI שלך</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
