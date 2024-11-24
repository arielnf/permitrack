import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirige al usuario a la página de inicio de sesión si no está autenticado
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);
};

export default useAuth;