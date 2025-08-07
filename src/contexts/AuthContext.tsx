
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if there's a stored user session on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('smo_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('smo_user');
      }
    }
    setIsLoading(false);
  }, []);

  // In a real application, this would call your authentication API
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual API call in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes only - simulate authentication
      if (username && password) {
        const user: User = {
          id: '123',
          username,
          token: 'mock-jwt-token',
        };
        
        setUser(user);
        localStorage.setItem('smo_user', JSON.stringify(user));
        toast.success('Connexion réussie');
        navigate('/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Échec de la connexion. Veuillez vérifier vos identifiants.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smo_user');
    toast.info('Vous avez été déconnecté');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
