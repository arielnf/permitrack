import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          // Redirige al usuario a la página de inicio de sesión si no está autenticado
          router.push('/login');
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error.message);
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);
};

export default useAuth;