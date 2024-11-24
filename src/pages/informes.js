"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/navbar';
import jsPDF from 'jspdf';
import useAuth from '../hooks/useAuth'; // Importa el hook

export default function Informes() {
  useAuth(); // Llama al hook para verificar la autenticación

  const [permisos, setPermisos] = useState([]);
  const [filtroRut, setFiltroRut] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);

  useEffect(() => {
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
        const permisosConEstado = data.map(permiso => {
          const aprobacionesOrdenadas = permiso.aprobaciones.sort((a, b) => new Date(b.fecha_aprobacion) - new Date(a.fecha_aprobacion));
          return {
            ...permiso,
            estado: aprobacionesOrdenadas[0]?.estado || 'pendiente',
            fecha_aprobacion: aprobacionesOrdenadas[0]?.fecha_aprobacion || 'N/A'
          };
        });

        setPermisos(permisosConEstado);
      }
    };

    fetchPermisos();
  }, []);

  const filtrarPermisos = () => {
    return permisos.filter((permiso) => {
      const rutCompleto = `${permiso.trabajadores.rut}-${permiso.trabajadores.dv}`;
      const fechaPermiso = new Date(permiso.fecha_permiso);
      const fechaInicioFiltro = fechaInicio ? new Date(fechaInicio) : null;
      const fechaFinFiltro = fechaFin ? new Date(fechaFin) : null;

      return (
        (filtroRut === '' || rutCompleto.includes(filtroRut)) &&
        (filtroEstado === '' || permiso.estado === filtroEstado) &&
        (!fechaInicioFiltro || fechaPermiso >= fechaInicioFiltro) &&
        (!fechaFinFiltro || fechaPermiso <= fechaFinFiltro)
      );
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const permisosFiltrados = filtrarPermisos();

    doc.text("Informe de Permisos", 20, 20);
    let yOffset = 30;

    permisosFiltrados.forEach((permiso, index) => {
      doc.text(
        `${index + 1}. ${permiso.trabajadores.nombre} ${permiso.trabajadores.apellidop} ${permiso.trabajadores.apellidom} - ${permiso.fecha_solicitud} - ${permiso.fecha_permiso} - ${permiso.estado}`,
        20,
        yOffset
      );
      yOffset += 10;
    });

    doc.save("informe_permisos.pdf");
  };

  const navbarLinks = [
    { href: '/gestionadores', label: 'Gestión' },
    { href: '/informes', label: 'Informes' },
    { href: '/trabajadores', label: 'Trabajadores' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar links={navbarLinks} />
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Generar Informes</h1>
        <div className="mb-4 flex flex-wrap justify-center">
          <div className="m-2">
            <label className="block text-gray-700">RUT:</label>
            <input
              type="text"
              placeholder="Buscar por RUT"
              value={filtroRut}
              onChange={(e) => setFiltroRut(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            />
          </div>
          <div className="m-2">
            <label className="block text-gray-700">Estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div className="m-2">
            <label className="block text-gray-700">Fecha Inicio:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            />
          </div>
          <div className="m-2">
            <label className="block text-gray-700">Fecha Fin:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full"
            />
          </div>
        </div>
        <div className="mb-4">
          <button
            onClick={() => setMostrarResultados(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 mr-2"
          >
            Buscar
          </button>
          <button
            onClick={generatePDF}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Descargar Informe en PDF
          </button>
        </div>
        {mostrarResultados && (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white shadow-md rounded">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 border-b text-left text-gray-700">RUT</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Nombre</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Fecha de Solicitud</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Fecha del Permiso</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Fecha de Aprobación</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Causal</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Tipo de Permiso</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Lugar de Trabajo</th>
                  <th className="py-2 px-4 border-b text-left text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtrarPermisos().map((permiso) => (
                  <tr key={permiso.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{permiso.trabajadores.rut}-{permiso.trabajadores.dv}</td>
                    <td className="py-2 px-4 border-b">{permiso.trabajadores.nombre} {permiso.trabajadores.apellidop} {permiso.trabajadores.apellidom}</td>
                    <td className="py-2 px-4 border-b">{permiso.fecha_solicitud}</td>
                    <td className="py-2 px-4 border-b">{permiso.fecha_permiso}</td>
                    <td className="py-2 px-4 border-b">{permiso.fecha_aprobacion}</td>
                    <td className="py-2 px-4 border-b">{permiso.causales.descripcion}</td>
                    <td className="py-2 px-4 border-b">{permiso.tipos_permiso.descripcion}</td>
                    <td className="py-2 px-4 border-b">{permiso.lugares_trabajo.nombre}</td>
                    <td className="py-2 px-4 border-b">{permiso.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
