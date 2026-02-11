import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ActivityIndicator, View, Alert } from 'react-native';

// Screens
import { WelcomeScreen } from './navigation/screens/WelcomeScreen'; 
import { AuthScreen } from './navigation/screens/AuthScreen'; 
import { Home } from './navigation/screens/Home';
import { Editor } from './navigation/screens/Editor';

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
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#FF4500"/>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // LOGGED IN FLOW
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Editor" component={Editor} />
          </>
        ) : (
          // AUTH FLOW
          <>
            <Stack.Screen name="Welcome">
              {(props: any) => (
                <WelcomeScreen 
                  onLogin={() => props.navigation.navigate('Login')} 
                  onSignup={() => props.navigation.navigate('Signup')} 
                />
              )}
            </Stack.Screen>
            
            <Stack.Screen name="Login">
              {(props: any) => (
                <AuthScreen mode="login" 
                  onBack={() => props.navigation.goBack()}
                  onAuth={async (email: string, pass: string) => {
                    try { 
                      await signInWithEmailAndPassword(auth, email, pass); 
                    } catch(e: any) { 
                      Alert.alert("Login Failed", e.message); 
                    }
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Signup">
              {(props: any) => (
                <AuthScreen mode="signup" 
                  onBack={() => props.navigation.goBack()}
                  onAuth={async (email: string, pass: string) => {
                    try { 
                      await createUserWithEmailAndPassword(auth, email, pass); 
                    } catch(e: any) { 
                      Alert.alert("Signup Failed", e.message); 
                    }
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}