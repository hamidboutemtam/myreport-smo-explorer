
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-smo-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page non trouvée</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button asChild>
            <Link to="/dashboard">
              Retour au tableau de bord
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">
              Connexion
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
