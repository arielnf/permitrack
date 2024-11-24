"use client";

import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Navbar({ links, showLogout = true }) {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
      alert('Error al cerrar sesión');
    } else {
      alert('Sesión cerrada con éxito');
      router.push('/login');
    }
  };

  return (
    <nav>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
        {showLogout && (
          <li>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </li>
        )}
      </ul>
      <style jsx>{`
        nav {
          background-color: #333;
          padding: 1rem;
        }
        ul {
          list-style: none;
          display: flex;
          justify-content: space-around;
          margin: 0;
          padding: 0;
        }
        li {
          margin: 0 1rem;
        }
        a, button {
          color: white;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover, a:hover {
          text-decoration: underline;
        }
      `}</style>
    </nav>
  );
}