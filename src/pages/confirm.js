"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ConfirmPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); // Para manejar el estado de carga
  const router = useRouter();

  // Verifica la sesión del usuario en el cliente
  useEffect(() => {
    const checkAuthSession = async () => {
      if (typeof window === "undefined") return; // Solo ejecutar en cliente

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          console.error("No hay sesión activa:", error?.message);
          alert("No hay sesión activa. Por favor, inicie sesión nuevamente.");
          router.push("/login"); // Redirige a login si no hay sesión activa
        }
      } catch (err) {
        console.error("Error al verificar la sesión:", err.message);
        alert("Ocurrió un error al verificar la sesión. Inténtalo más tarde.");
        router.push("/login");
      }
    };

    checkAuthSession();
  }, [router]);

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Por favor, completa ambos campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden. Por favor, inténtalo de nuevo.");
      return;
    }

    if (newPassword.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true); // Activa el estado de carga
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error al cambiar la contraseña:", error.message);
        alert(`Error al cambiar la contraseña: ${error.message}`);
      } else {
        alert("Contraseña cambiada con éxito.");
        router.push("/login");
      }
    } catch (err) {
      console.error("Error inesperado al cambiar la contraseña:", err.message);
      alert("Error inesperado. Por favor, inténtalo más tarde.");
    } finally {
      setLoading(false); // Desactiva el estado de carga
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">Cambiar Contraseña</h1>
        <input
          className="w-full px-4 py-2 mb-4 border rounded"
          type="password"
          placeholder="Nueva Contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 mb-4 border rounded"
          type="password"
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          className={`w-full px-4 py-2 font-bold text-white bg-blue-500 rounded ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          onClick={handlePasswordChange}
          disabled={loading} // Deshabilita el botón si está cargando
        >
          {loading ? "Cambiando..." : "Cambiar Contraseña"}
        </button>
      </div>
    </div>
  );
}
