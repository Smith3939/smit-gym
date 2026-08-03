import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { RTL_DIRECTION } from '../utils/rtl';
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
import SharedProfileScreen from '../screens/SharedProfileScreen';
import CommunityScreen from '../screens/CommunityScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Bottom-tab metrics.
 * Content box = TAB_BAR_CONTENT_HEIGHT - 2*TAB_BAR_V_PADDING, and must fit
 * ICON_SIZE + the 11px label + its 2px margin (~24 + 2 + 15 = 41px) with
 * room to spare, or React Navigation clips the icons.
 */
const ICON_SIZE = 24;
const TAB_BAR_V_PADDING = 10;
const TAB_BAR_CONTENT_HEIGHT = 74; // -> 54px content box

function HomeTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: COLORS.background }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'WorkoutTab') iconName = 'fitness-center';
          else if (route.name === 'NutritionTab') iconName = 'restaurant';
          else if (route.name === 'CommunityTab') iconName = 'groups';
          else if (route.name === 'AIChat') iconName = 'smart-toy';
          else if (route.name === 'Profile') iconName = 'person';
          // Fixed size rather than the injected `size` — that value varies by
          // platform and was overflowing the bar, clipping the icons.
          return <MaterialIcons name={iconName} size={ICON_SIZE} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          ...RTL_DIRECTION,
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          // Room for icon + label + breathing space, then the device inset on
          // top of that. (Old math left only 49px of content box, which cut
          // the icons off.)
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: TAB_BAR_V_PADDING,
          paddingBottom: TAB_BAR_V_PADDING + insets.bottom,
        },
        tabBarItemStyle: RTL_DIRECTION,
        // Pin the stacked layout. Left to itself React Navigation puts the
        // label beside the icon on wider viewports, which changes the height
        // the bar needs and is what made this hard to reproduce off-device.
        tabBarLabelPosition: 'below-icon',
        tabBarIconStyle: {
          height: ICON_SIZE,
          width: ICON_SIZE,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          includeFontPadding: false,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'ראשי' }} />
      <Tab.Screen name="WorkoutTab" component={WorkoutScreen} options={{ tabBarLabel: 'אימונים' }} />
      <Tab.Screen name="NutritionTab" component={NutritionScreen} options={{ tabBarLabel: 'תזונה' }} />
      <Tab.Screen name="CommunityTab" component={CommunityScreen} options={{ tabBarLabel: 'קהילה' }} />
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
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Main" component={HomeTabs} />
          <Stack.Screen name="WeightTracking" component={WeightTrackingScreen} />
          <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
          <Stack.Screen name="WaterTracking" component={WaterTrackingScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="RecipeGenerator" component={RecipeGeneratorScreen} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
      <Stack.Screen name="SharedProfile" component={SharedProfileScreen} />
    </Stack.Navigator>
  );
}
