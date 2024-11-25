import { createClient } from '@supabase/supabase-js';

// Obtiene las variables de entorno
const supabaseUrl = 'https://zemxmqzvrikiwsepnrxx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Se asegúrate de que las variables no estén vacías
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL y/o clave anónima no configuradas correctamente');
}

console.log('supabaseUrl:', supabaseUrl);  // Verifica que la URL esté cargada correctamente
console.log('supabaseAnonKey:', supabaseAnonKey);  // Verifica que la clave esté cargada correctamente

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
