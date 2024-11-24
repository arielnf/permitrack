"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/navbar';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkEmailVerificationToken = async () => {
      console.log('Verificando token de correo...');
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (accessToken && (type === 'signup' || type === 'magiclink' || type === 'email_change' || type === 'recovery')) {
        console.log('Token de verificación encontrado:', accessToken);
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token'),
        });

        if (error) {
          console.error('Error al establecer la sesión:', error.message);
        } else {
          router.push('/confirm');
        }
      } else {
        console.log('No se encontró token de verificación.');
      }
    };

    checkEmailVerificationToken();
  }, []);

  const navigateToLogin = () => {
    router.push('/login');
  };

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/login', label: 'Login' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Navbar links={links} showLogout={false} />
      <h1 className="text-3xl font-bold text-center mb-4">Bienvenido a PermitTrack</h1>
      <p className="text-center mb-4">Para continuar, por favor haga login.</p>
      <button
        onClick={navigateToLogin}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Login
      </button>
    </div>
  );
}