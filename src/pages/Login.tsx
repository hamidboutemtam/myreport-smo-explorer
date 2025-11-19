
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, Navigate } from 'react-router-dom';
import { setApiBaseUrl } from '@/services/api';

const ENVIRONMENTS = {
  localhost: {
    name: 'Localhost',
    url: 'http://localhost:8080'
  },
  espLogement: {
    name: 'EspLogement',
    url: 'https://spo.espaceserenity.com/ddbc9e3e-b9c7-4ad0-a3ee-43e705c49d37'
  }
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [environment, setEnvironment] = useState<keyof typeof ENVIRONMENTS>('localhost');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Set API base URL based on selected environment
      const selectedEnv = ENVIRONMENTS[environment];
      console.log('🔐 Logging in with environment:', selectedEnv.name, selectedEnv.url);
      setApiBaseUrl(selectedEnv.url);
      localStorage.setItem('smo_api_url', selectedEnv.url);
      localStorage.setItem('smo_environment', environment);
      
      await login(username, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-smo-light to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-smo-primary">SMO MyReport</h1>
          <p className="text-gray-600 mt-2">Explorateur d'opérations immobilières</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre espace
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Environnement</Label>
                <Select 
                  value={environment} 
                  onValueChange={(value) => setEnvironment(value as keyof typeof ENVIRONMENTS)}
                >
                  <SelectTrigger id="environment">
                    <SelectValue placeholder="Sélectionnez un environnement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="localhost">{ENVIRONMENTS.localhost.name}</SelectItem>
                    <SelectItem value="espLogement">{ENVIRONMENTS.espLogement.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre identifiant"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-smo-primary hover:bg-smo-dark"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} SMO MyReport. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Login;
