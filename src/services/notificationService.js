import { Platform, Alert } from 'react-native';

// Note: For full push notification support, install expo-notifications
// npx expo install expo-notifications
// For now, using a simplified in-app reminder system

let reminderCallbacks = [];

export function scheduleWeighInReminder(hour = 8, minute = 0) {
  // In production: use expo-notifications
  // For now: store reminder preference
  return {
    type: 'weigh_in',
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    enabled: true,
    message: 'בוקר טוב! הגיע הזמן לשקילה היומית 🏋️',
  };
}

export function scheduleWaterReminder(intervalHours = 2) {
  return {
    type: 'water',
    intervalHours,
    enabled: true,
    message: 'הגיע הזמן לשתות מים! 💧',
  };
}

export function scheduleWorkoutReminder(daysOfWeek = [0, 2, 4], hour = 17) {
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return {
    type: 'workout',
    days: daysOfWeek.map((d) => dayNames[d]),
    time: `${String(hour).padStart(2, '0')}:00`,
    enabled: true,
    message: 'הגיע הזמן לאימון! 💪',
  };
}

export function showInAppReminder(message) {
  Alert.alert('תזכורת', message, [{ text: 'אוקיי', style: 'default' }]);
}

export const REMINDER_TYPES = [
  {
    id: 'weigh_in',
    title: 'תזכורת שקילה',
    description: 'תזכורת לשקילה כל בוקר',
    icon: 'monitor-weight',
    defaultEnabled: true,
  },
  {
    id: 'water',
    title: 'תזכורת שתייה',
    description: 'תזכורת לשתות מים כל שעתיים',
    icon: 'water-drop',
    defaultEnabled: true,
  },
  {
    id: 'workout',
    title: 'תזכורת אימון',
    description: 'תזכורת לאימון בימים שנבחרו',
    icon: 'fitness-center',
    defaultEnabled: false,
  },
  {
    id: 'meals',
    title: 'תזכורת ארוחות',
    description: 'תזכורת לדווח ארוחות',
    icon: 'restaurant',
    defaultEnabled: false,
  },
];
