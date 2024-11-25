"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function ConfirmPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  // Verifica la sesión del usuario en el cliente
  useEffect(() => {
    const checkAuthSession = async () => {
      if (typeof window === 'undefined') return;  // Solo ejecutar en cliente

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          console.error('No hay sesión activa:', error?.message);
          alert('No hay sesión de autenticación activa. Por favor, inicie sesión nuevamente.');
          router.push('/login');  // Redirige a login si no hay sesión activa
        }
      } catch (err) {
        console.error('Error al verificar la sesión:', err.message);
        alert('Ocurrió un error al verificar la sesión. Inténtalo más tarde.');
        router.push('/login');
      }
    };

    checkAuthSession();
  }, [router]);

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Por favor, completa ambos campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden. Por favor, inténtalo de nuevo.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error al cambiar la contraseña:', error.message);
        alert(`Error al cambiar la contraseña: ${error.message}`);
      } else {
        alert('Contraseña cambiada con éxito.');
        router.push('/login');
      }
    } catch (err) {
      console.error('Error inesperado al cambiar la contraseña:', err.message);
      alert('Error inesperado. Por favor, inténtalo más tarde.');
    }
  };

  return (
    <div>
      <h1>Cambiar Contraseña</h1>
      <input
        type="password"
        placeholder="Nueva Contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirmar Contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handlePasswordChange}>Cambiar Contraseña</button>
    </div>
  );
}
