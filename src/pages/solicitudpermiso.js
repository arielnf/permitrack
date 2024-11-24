"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/navbar';
import useAuth from '../hooks/useAuth'; // Importa el hook

export default function SolicitudPermisoPage() {
  useAuth(); // Llama al hook para verificar la autenticación

  const [fechaPermiso, setFechaPermiso] = useState('');
  const [causalId, setCausalId] = useState('');
  const [tipoPermisoId, setTipoPermisoId] = useState('');
  const [lugarTrabajoId, setLugarTrabajoId] = useState('');
  const [causales, setCausales] = useState([]);
  const [tiposPermiso, setTiposPermiso] = useState([]);
  const [lugaresTrabajo, setLugaresTrabajo] = useState([]);
  const [trabajador, setTrabajador] = useState(null);
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [permisoEditadoId, setPermisoEditadoId] = useState(null);
  const [contadorPermisos, setContadorPermisos] = useState(0);

  const trabajadorLinks = [
    { href: '/solicitudpermiso', label: 'Solicitudes' },
  ];

  useEffect(() => {
    const { subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setTrabajador(null);
        setPermisos([]);
        setContadorPermisos(0);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchTrabajador = async () => {
      if (user && user.email) {
        try {
          const { data: trabajadorData, error: trabajadorError } = await supabase
            .from('trabajadores')
            .select('id, nombre, apellidop, apellidom')
            .eq('email', user.email)
            .single();

          if (trabajadorError) {
            console.error('Error al obtener trabajador:', trabajadorError.message);
            return;
          }

          if (trabajadorData) {
            setTrabajador(trabajadorData);
            fetchPermisos(trabajadorData.id);
          } else {
            console.error('Trabajador no encontrado para el usuario autenticado.');
          }
        } catch (error) {
          console.error('Error al obtener datos del trabajador:', error.message);
        }
      }
    };

    const fetchOptions = async () => {
      try {
        const { data: causalesData, error: causalesError } = await supabase.from('causales').select('id, descripcion');
        const { data: tiposPermisoData, error: tiposPermisoError } = await supabase.from('tipos_permiso').select('id, descripcion');
        const { data: lugaresTrabajoData, error: lugaresTrabajoError } = await supabase.from('lugares_trabajo').select('id, nombre');

        if (causalesError || tiposPermisoError || lugaresTrabajoError) {
          console.error('Error al obtener opciones:', causalesError?.message, tiposPermisoError?.message, lugaresTrabajoError?.message);
          return;
        }

        setCausales(causalesData || []);
        setTiposPermiso(tiposPermisoData || []);
        setLugaresTrabajo(lugaresTrabajoData || []);
      } catch (error) {
        console.error('Error al obtener las opciones:', error.message);
      }
    };

    if (user) {
      fetchTrabajador();
    }

    fetchOptions();
  }, [user]);

  const fetchPermisos = async (trabajadorId) => {
    try {
      const { data: permisosData, error } = await supabase
        .from('permisos')
        .select(`
          id,
          fecha_permiso,
          causal_id,
          tipo_permiso_id,
          lugar_trabajo_id,
          causales:causal_id(descripcion),
          tipos_permiso:tipo_permiso_id(descripcion),
          lugares_trabajo:lugar_trabajo_id(nombre),
          aprobaciones (
            estado,
            fecha_aprobacion
          )
        `)
        .eq('trabajador_id', trabajadorId)
        .order('fecha_permiso', { ascending: false });

      if (error) {
        console.error('Error al obtener permisos:', error.message);
        return;
      }

      const permisosConEstado = permisosData.map(permiso => {
        const aprobacionMasReciente = permiso.aprobaciones.sort((a, b) => new Date(b.fecha_aprobacion) - new Date(a.fecha_aprobacion))[0] || {};
        return {
          ...permiso,
          estado: aprobacionMasReciente.estado || 'Pendiente',
          fecha_aprobacion: aprobacionMasReciente.fecha_aprobacion || 'N/A'
        };
      });

      setPermisos(permisosConEstado);
      setContadorPermisos(permisosConEstado.length);
    } catch (error) {
      console.error('Error al obtener los permisos:', error.message);
    }
  };

  const validateFields = () => {
    if (!fechaPermiso) {
      alert('Por favor, selecciona una fecha para el permiso.');
      return false;
    }
    if (!causalId) {
      alert('Por favor, selecciona una causal.');
      return false;
    }
    if (!tipoPermisoId) {
      alert('Por favor, selecciona un tipo de permiso.');
      return false;
    }
    if (!lugarTrabajoId) {
      alert('Por favor, selecciona un lugar de trabajo.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      if (permisoEditadoId) {
        const { error } = await supabase
          .from('permisos')
          .update({
            fecha_permiso: fechaPermiso,
            causal_id: parseInt(causalId),
            tipo_permiso_id: parseInt(tipoPermisoId),
            lugar_trabajo_id: parseInt(lugarTrabajoId),
          })
          .eq('id', permisoEditadoId);

        if (error) { console.error('Error al actualizar el permiso:', error.message);
          alert('Error al actualizar el permiso.');
        } else {
          alert('Permiso actualizado con éxito.');
          setPermisoEditadoId(null);
          setFechaPermiso('');
          setCausalId('');
          setTipoPermisoId('');
          setLugarTrabajoId('');
          fetchPermisos(trabajador.id);
        }
      } else {
        // Crear un nuevo permiso
        const { data: permisoData, error: permisoError } = await supabase
          .from('permisos')
          .insert([{
            trabajador_id: trabajador.id,
            fecha_permiso: fechaPermiso,
            fecha_solicitud: new Date().toISOString().split('T')[0],
            causal_id: parseInt(causalId),
            tipo_permiso_id: parseInt(tipoPermisoId),
            lugar_trabajo_id: parseInt(lugarTrabajoId),
          }])
          .select()
          .single();

        if (permisoError) {
          console.error('Error al enviar la solicitud de permiso:', permisoError);
          alert('Error al enviar la solicitud de permiso: ' + permisoError.message);
        } else {
          alert('Solicitud de permiso enviada con éxito');
          setFechaPermiso('');
          setCausalId('');
          setTipoPermisoId('');
          setLugarTrabajoId('');
          fetchPermisos(trabajador.id);
        }
      }
    } catch (error) {
      console.error('Error al enviar la solicitud:', error.message);
      alert('Error al enviar la solicitud: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este permiso?')) {
      try {
        const { error } = await supabase
          .from('permisos')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error al eliminar el permiso:', error.message);
          alert('Error al eliminar el permiso.');
        } else {
          alert('Permiso eliminado con éxito.');
          fetchPermisos(trabajador.id);
        }
      } catch (error) {
        console.error('Error al eliminar el permiso:', error.message);
        alert('Error al eliminar el permiso.');
      }
    }
  };

  const handleEdit = (permiso) => {
    setFechaPermiso(permiso.fecha_permiso);
    setCausalId(permiso.causal_id);
    setTipoPermisoId(permiso.tipo_permiso_id);
    setLugarTrabajoId(permiso.lugar_trabajo_id);
    setPermisoEditadoId(permiso.id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar links={trabajadorLinks} />
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Ingresar Solicitud de Permiso</h1>

        {trabajador && (
          <p className="mb-4 text-lg text-gray-700">
            Bienvenido, <strong>{trabajador.nombre} {trabajador.apellidop} {trabajador.apellidom}</strong>.
          </p>
        )}

        <p className="mb-4 text-lg text-gray-700">Total de Permisos: {contadorPermisos}</p>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <input
            type="date"
            placeholder="Fecha del Permiso"
            value={fechaPermiso}
            onChange={(e) => setFechaPermiso(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <select
            value={causalId}
            onChange={(e) => setCausalId(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona una causal</option>
            {causales.map((causal) => (
              <option key={causal.id} value={causal.id}>{causal.descripcion}</option>
            ))}
          </select>
          <select
            value={tipoPermisoId}
            onChange={(e) => setTipoPermisoId(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona un tipo de permiso</option>
            {tiposPermiso.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
            ))}
          </select>
          <select
            value={lugarTrabajoId}
            onChange={(e) => setLugarTrabajoId(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Selecciona un lugar de trabajo</option>
            {lugaresTrabajo.map((lugar) => (
              <option key={lugar.id} value={lugar.id}>{lugar.nombre}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 mb-4"
        >
          {permisoEditadoId ? 'Actualizar Permiso' : 'Solicitar Permiso'}
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-800">Mis Solicitudes de Permiso</h2>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-white shadow-md rounded">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b text-left text-gray-700">Día Solicitado</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Causal</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Tipo de Permiso</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Lugar de Trabajo</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Estado</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Fecha de Aprobación</th>
                <th className="py-2 px-4 border-b text-left text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {permisos.map((permiso) => (
                <tr key={permiso.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{permiso.fecha_permiso}</td>
                  <td className="py-2 px-4 border-b">{permiso.causales?.descripcion}</td>
                  <td className="py-2 px-4 border-b">{permiso.tipos_permiso?.descripcion}</td>
                  <td className="py-2 px-4 border-b">{permiso.lugares_trabajo?.nombre}</td>
                  <td className="py-2 px-4 border-b">{permiso.estado}</td>
                  <td className="py-2 px-4 border-b">{permiso.fecha_aprobacion}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleEdit(permiso)}
                      className="bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-700 mr-2"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(permiso.id)}
                      className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
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

