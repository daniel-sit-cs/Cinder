import React, { useEffect, useState } from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

import { Home }          from './screens/Home';
import { Editor }        from './screens/Editor';
import { ProjectDetail } from './screens/ProjectDetail';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { Login }         from './screens/Login';
import { Signup }        from './screens/Signup';

export function RootNavigation() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return null;

  const RootStack = createNativeStackNavigator({
    screens: user
      ? {
          Home:          { screen: Home,          options: { headerShown: false } },
          Editor:        { screen: Editor,        options: { headerShown: false } },
          ProjectDetail: { screen: ProjectDetail, options: { headerShown: false } },
        }
      : {
          Welcome: { screen: WelcomeScreen, options: { headerShown: false } },
          Login:   { screen: Login,         options: { headerShown: false } },
          Signup:  { screen: Signup,        options: { headerShown: false } },
        },
  });

  const Navigation = createStaticNavigation(RootStack);
  return <Navigation />;
}
