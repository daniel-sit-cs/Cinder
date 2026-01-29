// src/navigation/index.tsx
import React, { useEffect, useState } from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Import your screens
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { Editor } from './screens/Editor';
// ... (keep your other imports like Profile, Settings, etc.)

const HomeTabs = createBottomTabNavigator({
  screens: {
    Home: { screen: Home, options: { title: 'Feed' } },
    // ... (keep your existing Updates tab)
  },
});

export function RootNavigation() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return null; // Or a loading spinner in CinderOrange

  // Define the stack based on auth state
  const RootStack = createNativeStackNavigator({
    screens: user 
      ? {
          // APP STACK (Logged In)
          HomeTabs: { screen: HomeTabs, options: { headerShown: false } },
          // Profile: { screen: Profile }, etc...
          Editor: { screen: Editor, options: { title: 'Create Story' } },
        }
      : {
          // AUTH STACK (Logged Out)
          Login: { screen: Login, options: { title: 'Sign In' } },
          Signup: { screen: Signup, options: { title: 'Create Account' } },
        },
        
  });

  const Navigation = createStaticNavigation(RootStack);
  
  // Return the actual Navigation component
  // Note: App.tsx will now render <RootNavigation /> instead of <Navigation />
  return <Navigation />;
}