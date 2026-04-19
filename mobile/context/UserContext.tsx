import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from '../utils/storage';

interface UserData {
  name: string;
  position: string;
  id: string;
  isPic: boolean;
  role: string;
  token: string | null;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  login: (data: UserData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromStorage = async () => {
    try {
      const name = await SecureStore.getItemAsync('user_name');
      const position = await SecureStore.getItemAsync('user_position');
      const id = await SecureStore.getItemAsync('user_id');
      const isPic = await SecureStore.getItemAsync('user_is_pic');
      const role = await SecureStore.getItemAsync('user_role');
      const token = await SecureStore.getItemAsync('user_token');

      if (token && id) {
        setUser({
          name: name || '',
          position: position || '',
          id: id || '',
          isPic: isPic === 'true',
          role: role || 'employee',
          token: token,
        });
      }
    } catch (e) {
      console.error('Error loading user from storage', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const login = async (data: UserData) => {
    setUser(data);
    await Promise.all([
      SecureStore.setItemAsync('user_name', data.name),
      SecureStore.setItemAsync('user_position', data.position),
      SecureStore.setItemAsync('user_id', data.id),
      SecureStore.setItemAsync('user_is_pic', data.isPic ? 'true' : 'false'),
      SecureStore.setItemAsync('user_role', data.role),
      SecureStore.setItemAsync('user_token', data.token || ''),
    ]);
  };

  const logout = async () => {
    setUser(null);
    await Promise.all([
      SecureStore.deleteItemAsync('user_name'),
      SecureStore.deleteItemAsync('user_position'),
      SecureStore.deleteItemAsync('user_id'),
      SecureStore.deleteItemAsync('user_is_pic'),
      SecureStore.deleteItemAsync('user_role'),
      SecureStore.deleteItemAsync('user_token'),
      SecureStore.deleteItemAsync('read_notifications'),
    ]);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser: loadUserFromStorage }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
