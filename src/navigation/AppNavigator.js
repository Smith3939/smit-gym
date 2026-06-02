import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';

import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import NutritionScreen from '../screens/NutritionScreen';
import AIChatScreen from '../screens/AIChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeightTrackingScreen from '../screens/WeightTrackingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import WaterTrackingScreen from '../screens/WaterTrackingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RecipeGeneratorScreen from '../screens/RecipeGeneratorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function HomeTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'WorkoutTab') iconName = 'fitness-center';
          else if (route.name === 'NutritionTab') iconName = 'restaurant';
          else if (route.name === 'AIChat') iconName = 'smart-toy';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 65 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'ראשי' }} />
      <Tab.Screen name="WorkoutTab" component={WorkoutScreen} options={{ tabBarLabel: 'אימונים' }} />
      <Tab.Screen name="NutritionTab" component={NutritionScreen} options={{ tabBarLabel: 'תזונה' }} />
      <Tab.Screen name="AIChat" component={AIChatScreen} options={{ tabBarLabel: 'מאמן AI' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'פרופיל' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Main" component={HomeTabs} />
          <Stack.Screen name="WeightTracking" component={WeightTrackingScreen} />
          <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
          <Stack.Screen name="WaterTracking" component={WaterTrackingScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="RecipeGenerator" component={RecipeGeneratorScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
