"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function ConfirmPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuthSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.error('No hay sesión de autenticación activa:', error?.message);
        alert('No hay sesión de autenticación activa. Por favor, inicie sesión nuevamente.');
        router.push('/login');
      }
    };

    checkAuthSession();
  }, [router]); // Agrega 'router' aquí

  const handlePasswordChange = async () => {
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
        alert('Error al cambiar la contraseña');
      } else {
        alert('Contraseña cambiada con éxito');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error.message);
      alert('Error al cambiar la contraseña');
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