"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/navbar'; 
import useAuth from '../hooks/useAuth'; // Importa el hook

export default function Gestionadores() {
  useAuth(); // Llama al hook para verificar la autenticación

  const [permisos, setPermisos] = useState([]);
  const [gestor, setGestor] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  const gestionadorLinks = [
    { href: '/gestionadores', label: 'Gestión' },
    { href: '/informes', label: 'Informes' },
    { href: '/trabajadores', label: 'Trabajadores' },
  ];

  useEffect(() => {
    const fetchGestor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('gestores')
          .select('id, nombre, apellidop, apellidom')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error al obtener datos del gestor:', error.message);
        } else {
          setGestor(data);
        }
      }
    };

    fetchGestor();
  }, []);

  const fetchPermisos = async () => {
    const { data, error } = await supabase
      .from('permisos')
      .select(`
        id,
        fecha_permiso,
        fecha_solicitud,
        trabajadores (
          rut,
          dv,
          nombre,
          apellidop,
          apellidom
        ),
        causales (
          descripcion
        ),
        tipos_permiso (
          descripcion
        ),
        lugares_trabajo (
          nombre
        ),
        aprobaciones (
          estado,
          fecha_aprobacion
        )
      `);

    if (error) {
      console.error('Error al obtener permisos:', error.message);
    } else {
      const permisosConEstadoReciente = data.map(permiso => {
        const aprobacionesOrdenadas = permiso.aprobaciones.sort((a, b) => new Date(b.fecha_aprobacion) - new Date(a.fecha_aprobacion));
        return {
          ...permiso,
          aprobaciones: aprobacionesOrdenadas[0] || { estado: 'pendiente' }
        };
      });

      setPermisos(permisosConEstadoReciente);
    }
  };

  useEffect(() => {
    fetchPermisos();
  }, []);

  const handleEstadoChange = async (permisoId, nuevoEstado) => {
    if (!nuevoEstado) {
      alert('Por favor, seleccione un estado válido.');
      return;
    }

    try {
      const { data: existingAprobaciones, error: fetchError } = await supabase
        .from('aprobaciones')
        .select('estado')
        .eq('permiso_id', permisoId);

      if (fetchError) {
        console.error('Error al verificar estado existente:', fetchError.message);
        alert('Error al verificar estado existente.');
        return;
      }

      if (existingAprobaciones.length > 0) {
        alert('Este permiso ya ha sido aprobado o rechazado y no se puede cambiar.');
        return;
      }

      const { error } = await supabase
        .from('aprobaciones')
        .insert([{
          permiso_id: permisoId,
          gestor_id: gestor.id,
          estado: nuevoEstado,
          fecha_aprobacion: new Date().toISOString().split('T')[0]
        }]);

      if (error) {
        console.error('Error al actualizar el estado del permiso:', error.message);
        alert('Error al actualizar el estado del permiso.');
      } else {
        alert('Estado del permiso actualizado con éxito.');
        fetchPermisos(); // Actualizar la lista de permisos
      }
    } catch (error) {
      console.error('Error al actualizar el estado del permiso:', error.message);
      alert('Error al actualizar el estado del permiso.');
    }
  };

  // Filtrar permisos según el estado seleccionado
  const permisosFiltrados = permisos.filter(permiso => 
    filtroEstado === '' ? true : permiso.aprobaciones?.estado === filtroEstado
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar links={gestionadorLinks} />
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Gestión de Permisos</h1>
        {gestor && (
          <p className="mb-4 text-lg text-gray-700">Bienvenido, {gestor.nombre} {gestor.apellidop} {gestor.apellidom}</p>
        )}
        <div className="mb-4">
          <label htmlFor="filtroEstado" className="mr-2 text-gray-700">Filtrar por estado:</label>
          <select
            id="filtroEstado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Seleccione un estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-white shadow-md rounded">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b text-left text-gray-700">RUT</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Nombre</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Fecha de Solicitud</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Día del Permiso</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Causal</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Tipo de Permiso</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Lugar de Trabajo</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {permisosFiltrados.map((permiso) => (
                <tr key={permiso.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{permiso.trabajadores.rut}-{permiso.trabajadores.dv}</td>
                  <td className="py-2 px-4 border-b">{permiso.trabajadores.nombre} {permiso.trabajadores.apellidop} {permiso.trabajadores.apellidom}</td>
                  <td className="py-2 px-4 border-b">{permiso.fecha_solicitud}</td>
                  <td className="py-2 px-4 border-b">{permiso.fecha_permiso}</td>
                  <td className="py-2 px-4 border-b">{permiso.causales.descripcion}</td>
                  <td className="py-2 px-4 border-b">{permiso.tipos_permiso.descripcion}</td>
                  <td className="py-2 px-4 border-b">{permiso.lugares_trabajo.nombre}</td>
                  <td className="py-2 px-4 border-b">
                    <select
                      value={permiso.aprobaciones?.estado || 'pendiente'}
                      onChange={(e) => handleEstadoChange(permiso.id, e.target.value)}
                      disabled={permiso.aprobaciones?.estado !== 'pendiente'}
                      className="p-1 border border-gray-300 rounded"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
