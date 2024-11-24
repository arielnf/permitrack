"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Navbar from '../components/navbar';

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Por favor, ingresa tu correo electrónico y contraseña.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    try {
      const { data: gestor, error: gestorError } = await supabase
        .from("gestores")
        .select("id, email")
        .eq("email", email)
        .single();

      if (gestorError) {
        const { data: trabajador, error: trabajadorError } = await supabase
          .from("trabajadores")
          .select("id")
          .eq("email", email)
          .single();

        if (trabajadorError) {
          alert("No existe registro con este email. Comuníquese con el administrador.");
          return;
        }

        const { error: trabajadorSignInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (trabajadorSignInError) {
          alert("Credenciales incorrectas para trabajador.");
          return;
        }

        alert("Inicio de sesión exitoso como trabajador.");
        router.push("/solicitudpermiso");
        return;
      }

      const { error: gestorSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (gestorSignInError) {
        if (gestorSignInError.message.includes("Invalid login credentials")) {
          const tempPassword = "claveTemporal123";
          const { error: tempPasswordError } = await supabase.auth.signUp({
            email,
            password: tempPassword,
            options: {
              emailRedirectTo: "http://localhost:3000/confirm",
            },
          });

          if (tempPasswordError) {
            alert("Error al enviar contraseña temporal. Intente nuevamente.");
            return;
          }

          alert(
            "No tienes una contraseña registrada. Se ha enviado un correo con un enlace para configurarla. Revisa tu bandeja de entrada."
          );
          return;
        }

        alert("Credenciales incorrectas para gestor.");
        return;
      }

      alert("Inicio de sesión exitoso como gestor.");
      router.push("/gestionadores");
    } catch (error) {
      alert("Error al iniciar sesión. Intente nuevamente.");
    }
  };

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/login', label: 'Login' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar links={links} showLogout={false} />
      <div className="flex flex-1 items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white p-8 rounded shadow-md">
          <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}