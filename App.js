import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from "@expo/vector-icons/FontAwesome";

import HomeScreen from './screens/HomeScreen';
import SftScreen from './screens/SftScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';
import AdminUnfitLogScreen from './screens/AdminUnfitLogScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const [activeIsAdmin, setActiveIsAdmin] = useState(false);

  useEffect(() => {
    const loadActive = async () => {
      try {
        const a = await AsyncStorage.getItem('activeProfile');
        if (a) {
          const p = JSON.parse(a);
          setActiveIsAdmin(!!p.isAdmin);
        }
      } catch (e) {
        // ignore
      }
    };
    loadActive();
  }, []);

  return (
    <Tabs.Navigator screenOptions={({ route }) => ({
      tabBarActiveTintColor: 'green',
      tabBarInactiveTintColor: 'gray',
      tabBarIcon: ({ color, size }) => {
        let iconName = 'question-circle';
        if (route.name === 'Home') iconName = 'home';
        if (route.name === 'MySFT') iconName = 'universal-access';
        if (route.name === 'MyProfile') iconName = 'address-book';
        if (route.name === 'Admin') iconName = 'lock';
        return <FontAwesome name={iconName} size={size} color={color} />;
      },
    })}>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: true, headerTitle: 'Home', headerTitleAlign: 'center' }}
      />
      <Tabs.Screen name="MySFT" component={SftScreen} />
      <Tabs.Screen
        name="MyProfile"
        component={ProfileScreen}
        options={{ headerShown: true, headerTitle: 'MyProfile', headerTitleAlign: 'center' }}
      />
      {activeIsAdmin && <Tabs.Screen name="Admin" component={AdminScreen} />}
    </Tabs.Navigator>
  );
}

export default function App() {
  // seeder removed
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
  <Stack.Screen name="AdminUnfitLog" component={AdminUnfitLogScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}