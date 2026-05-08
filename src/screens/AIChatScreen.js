import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../config/theme';

const INITIAL_MESSAGE = {
  id: '1',
  role: 'assistant',
  content: 'שלום! אני המאמן AI שלך 💪\n\nאני יכול לעזור לך עם:\n• הצעות לתרגילים חלופיים\n• החלפת מזונות בתפריט\n• שאלות על תזונה וכושר\n• טיפים לאימון\n\nמה תרצה לדעת?',
};

export default function AIChatScreen() {
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

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // AI response simulation - will be replaced with Claude API
    setTimeout(() => {
      const aiResponse = generateLocalResponse(text.trim());
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
      }]);
      setIsLoading(false);
    }, 1000);
  };

  const generateLocalResponse = (question) => {
    const q = question.toLowerCase();

    if (q.includes('אורז') || q.includes('פחמימ') || q.includes('החלפ')) {
      return 'בטח! הנה אלטרנטיבות לפחמימה:\n\n🍚 במקום אורז אפשר:\n• בורגול - 83 קלוריות ל-100 גרם\n• קוסקוס - 112 קלוריות ל-100 גרם\n• קינואה - 120 קלוריות ל-100 גרם\n• בטטה - 86 קלוריות ל-100 גרם\n• תפוח אדמה - 77 קלוריות ל-100 גרם\n\nכל אלה מקורות פחמימה מצוינים. רוצה שאעזור לך לחשב כמויות?';
    }

    if (q.includes('חלבון') || q.includes('כמה')) {
      return 'המלצה כללית לצריכת חלבון:\n\n💪 לבניית שריר: 1.6-2.2 גרם לכל ק"ג משקל גוף\n🏃 לחיטוב: 2.0-2.4 גרם לכל ק"ג משקל גוף\n\nלדוגמה, אם אתה שוקל 70 ק"ג:\n• בנייה: 112-154 גרם חלבון ביום\n• חיטוב: 140-168 גרם חלבון ביום\n\nחשוב לחלק את החלבון לאורך כל הארוחות!';
    }

    if (q.includes('תרגיל') || q.includes('חלופי') || q.includes('באנצ')) {
      return 'תרגילים חלופיים לבאנצ פרס:\n\n🔄 אפשרויות:\n• לחיצת חזה במכונה - יותר בטוח, תנועה מבוקרת\n• שכיבות סמיכה עם משקולות - עבודה עם משקל חופשי\n• לחיצת חזה עליון בסמית - דגש על חזה עליון\n• פרפר בכבלים - בידוד שריר החזה\n\nלכל אחד יתרונות שונים. מה המטרה שלך?';
    }

    if (q.includes('חיטוב') || q.includes('תכנית')) {
      return 'עקרונות לתכנית חיטוב:\n\n📋 אימונים:\n• 4-5 אימונים בשבוע\n• שילוב אירובי 3 פעמים בשבוע\n• טווח חזרות 8-15\n• מנוחה קצרה בין סטים (60-90 שניות)\n\n🥗 תזונה:\n• גירעון קלורי של 300-500 קלוריות\n• חלבון גבוה (2+ גרם לק"ג)\n• הרבה ירקות\n• שתייה של 3+ ליטר מים\n\nרוצה שאפרט יותר על משהו?';
    }

    return 'שאלה מעולה! 🤔\n\nאני כאן כדי לעזור לך עם כל שאלה על כושר ותזונה. תוכל לשאול אותי על:\n• החלפת מזונות בתפריט\n• תרגילים חלופיים\n• תכניות אימון\n• ערכים תזונתיים\n• טיפים לאימון\n\nנסה לשאול שאלה ספציפית יותר ואשמח לעזור!';
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
