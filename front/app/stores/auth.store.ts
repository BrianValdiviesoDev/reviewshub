import { create } from 'zustand';
import { User } from '../entities/user.entity';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const initialToken =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const initialUser =
    typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || 'null')
      : null;

  set({
    token: initialToken,
    user: initialUser,
  });

  return {
    token: initialToken,
    user: initialUser,
    setAuth: (user: User, token: string) => {
      set({ token });
      set({ user });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    },
  };
});
