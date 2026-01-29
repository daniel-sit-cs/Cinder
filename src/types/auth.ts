// src/types/auth.ts
import { User as FirebaseUser } from 'firebase/auth';

export interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
}

export type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
};