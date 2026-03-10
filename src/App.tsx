import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ActivityIndicator, View } from 'react-native';
import { colors } from './theme/tokens';

import { WelcomeScreen } from './navigation/screens/WelcomeScreen';
import { Login }         from './navigation/screens/Login';
import { Signup }        from './navigation/screens/Signup';
import { Home }          from './navigation/screens/Home';
import { Editor }        from './navigation/screens/Editor';
import { ProjectDetail } from './navigation/screens/ProjectDetail';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home"          component={Home} />
            <Stack.Screen name="Editor"        component={Editor} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetail} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login"   component={Login} />
            <Stack.Screen name="Signup"  component={Signup} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
