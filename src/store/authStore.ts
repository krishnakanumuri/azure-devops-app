import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PAT_KEY = 'ado_pat';
const ORG_KEY = 'ado_org_url';

interface AuthState {
  orgUrl: string;
  pat: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (orgUrl: string, pat: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Clears the PAT and de-authenticates but preserves orgUrl for the login screen pre-fill. */
  expireSession: () => Promise<void>;
  loadStored: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  orgUrl: '',
  pat: '',
  isAuthenticated: false,
  isLoading: true,

  login: async (orgUrl, pat) => {
    const normalised = orgUrl.replace(/\/+$/, '');
    await AsyncStorage.setItem(ORG_KEY, normalised);
    await AsyncStorage.setItem(PAT_KEY, pat);
    set({ orgUrl: normalised, pat, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem(ORG_KEY);
    await AsyncStorage.removeItem(PAT_KEY);
    set({ orgUrl: '', pat: '', isAuthenticated: false });
  },

  expireSession: async () => {
    await AsyncStorage.removeItem(PAT_KEY);
    // orgUrl is intentionally kept so the login screen can pre-fill it
    set({ pat: '', isAuthenticated: false });
  },

  loadStored: async () => {
    try {
      const orgUrl = await AsyncStorage.getItem(ORG_KEY);
      const pat = await AsyncStorage.getItem(PAT_KEY);
      if (orgUrl && pat) {
        set({ orgUrl, pat, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
