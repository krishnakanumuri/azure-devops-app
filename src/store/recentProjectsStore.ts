import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Project } from '../types/devops';

const RECENT_KEY = 'ado_recent_projects';
const MAX_RECENT = 5;

interface RecentProjectsState {
  recentProjects: Project[];
  addRecentProject: (project: Project) => Promise<void>;
  loadStored: () => Promise<void>;
}

export const useRecentProjectsStore = create<RecentProjectsState>((set, get) => ({
  recentProjects: [],

  addRecentProject: async (project: Project) => {
    const current = get().recentProjects;
    const deduped = current.filter(p => p.id !== project.id);
    const updated = [project, ...deduped].slice(0, MAX_RECENT);
    set({ recentProjects: updated });
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  },

  loadStored: async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed: Project[] = JSON.parse(raw);
        set({ recentProjects: parsed });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));
