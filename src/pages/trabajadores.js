"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/navbar";
import useAuth from '../hooks/useAuth'; // Importa el hook

export default function Trabajadores({ initialTrabajadores }) {
  useAuth(); // Llama al hook para verificar la autenticación

  const [trabajadores, setTrabajadores] = useState(initialTrabajadores);
  const [formData, setFormData] = useState({
    rut: "",
    dv: "",
    nombre: "",
    apellidop: "",
    apellidom: "",
    email: "",
    cargo: "",
  });
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState(null);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const calculateDV = (rut) => {
    let suma = 0;
    let multiplo = 2;

    for (let i = rut.length - 1; i >= 0; i--) {
      suma += parseInt(rut[i]) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const resto = 11 - (suma % 11);

    if (resto === 11) return "0";
    if (resto === 10) return "k";
    return String(resto);
  };

  const validateRut = (rut, dv) => {
    const rutStr = String(rut);
    if (!/^\d+$/.test(rutStr)) {
      return false;
    }

    const calculatedDV = calculateDV(rutStr);
    return calculatedDV.toLowerCase() === dv.toLowerCase();
  };

  const handleBlur = (field) => {
    let newErrors = { ...errors };

    switch (field) {
      case "email":
        if (!formData.email) {
          newErrors.email = "Ingrese un email.";
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "Ingrese un formato de email válido.";
        } else {
          delete newErrors.email;
        }
        break;
      case "rut":
      case "dv":
        const isValidRut = validateRut(formData.rut, formData.dv);
        if (!isValidRut) {
          newErrors.rut = "El RUT o DV ingresado no es válido.";
        } else {
          delete newErrors.rut;
        }
        break;
      case "nombre":
        if (!formData.nombre) {
          newErrors.nombre = "Ingrese un nombre.";
        } else {
          delete newErrors.nombre;
        }
        break;
      case "apellidop":
        if (!formData.apellidop) {
          newErrors.apellidop = "Ingrese un apellido paterno.";
        } else {
          delete newErrors.apellidop;
        }
        break;
      case "apellidom":
        if (!formData.apellidom) {
          newErrors.apellidom = "Ingrese un apellido materno.";
        } else {
          delete newErrors.apellidom;
        }
        break;
      case "cargo":
        if (!formData.cargo) {
          newErrors.cargo = "Ingrese un cargo.";
        } else {
          delete newErrors.cargo;
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const updateEmail = async (newEmail) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        console.error("Error al actualizar el correo electrónico:", error.message);
        alert("Error al actualizar el correo electrónico: " + error.message);
        return false;
      }

      alert("Correo electrónico actualizado. Por favor, verifica tu nuevo correo.");
      return true;
    } catch (error) {
      console.error("Error al actualizar el correo electrónico:", error.message);
      alert("Error al actualizar el correo electrónico: " + error.message);
      return false;
    }
  };

  const addOrUpdateTrabajador = async () => {
    if (
      Object.keys(errors).length > 0 ||
      !formData.rut
      || !formData.dv
      || !formData.nombre
      || !formData.apellidop
      || !formData.apellidom
      || !formData.email
      || !formData.cargo
    ) {
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }

    if (!validateEmail(formData.email)) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    const isValidRut = validateRut(formData.rut, formData.dv);
    if (!isValidRut) {
      alert("Por favor, ingresa un RUT y DV válidos.");
      return;
    }

    try {
      if (editMode) {
        const originalWorker = trabajadores.find((t) => t.id === editWorkerId);
        if (originalWorker.email !== formData.email) {
          const emailUpdated = await updateEmail(formData.email);
          if (!emailUpdated) return;
        }

        const { id, ...dataToUpdate } = formData;

        const { error } = await supabase
          .from("trabajadores")
          .update(dataToUpdate)
          .eq("id", editWorkerId);

        if (error) {
          console.error("Error al actualizar trabajador:", error.message);
          alert("Error al actualizar trabajador: " + error.message);
          return;
        }

        setTrabajadores(
          trabajadores.map((trabajador) =>
            trabajador.id === editWorkerId ? { ...trabajador, ...dataToUpdate } : trabajador
          )
        );
        alert("Trabajador actualizado con éxito.");
      } else {
        const tempPassword = "claveTemporalSegura123!";
        const { user, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
        });

        if (signUpError) {
          console.error("Error al registrar trabajador:", signUpError.message);
          alert("Error al registrar trabajador: " + signUpError.message);
          return;
        }

        const { data, error } = await supabase
          .from("trabajadores")
          .insert([formData]);

        if (error) {
          console.error("Error al insertar trabajador:", error.message);
          alert("Error al insertar trabajador: " + error.message);
        } else {
          alert(
            "Trabajador registrado con éxito. Por favor, revise su correo para confirmar."
          );
          if (Array.isArray(data)) {
            setTrabajadores([...trabajadores, ...data]);
          }
        }
      }

      setFormData({
        rut: "",
        dv: "",
        nombre: "",
        apellidop: "",
        apellidom: "",
        email: "",
        cargo: "",
      });
      setErrors({});
      setEditMode(false);
    } catch (error) {
      console.error("Error al registrar o actualizar trabajador:", error.message);
      alert("Error al registrar o actualizar trabajador: " + error.message);
    }
  };

  const enableEditMode = (trabajador) => {
    setEditMode(true);
    setEditWorkerId(trabajador.id);
    setFormData({ ...trabajador });
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setFormData({
      rut: "",
      dv: "",
      nombre: "",
      apellidop: "",
      apellidom: "",
      email: "",
      cargo: "",
    });
    setErrors({});
  };

  const deleteWorker = async (id) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este trabajador?")) return;

    try {
      const { error } = await supabase.from("trabajadores").delete().eq("id", id);
      if (error) {
        console.error("Error al eliminar trabajador:", error.message);
        alert("Error al eliminar trabajador: " + error.message);
        return;
      }

      setTrabajadores(trabajadores.filter((trabajador) => trabajador.id !== id));
      alert("Trabajador eliminado con éxito.");
    } catch (error) {
      console.error("Error al eliminar trabajador:", error.message);
      alert("Error al eliminar trabajador: " + error.message);
    }
  };

  const navbarLinks = [
    { href: "/gestionadores", label: "Gestión" },
    { href: "/informes", label: "Informes" },
    { href: "/trabajadores", label: "Trabajadores" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar links={navbarLinks} />
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Lista de Trabajadores</h1>
        <ul className="mb-4">
          {trabajadores.map((trabajador) => (
            <li key={trabajador.id} className="mb-2">
              {trabajador.rut}-{trabajador.dv} - {trabajador.nombre}{" "}
              {trabajador.apellidop} {trabajador.apellidom} - {trabajador.email} -{" "}
              {trabajador.cargo}
              <button
                onClick={() => enableEditMode(trabajador)}
                className="ml-2 bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={() => deleteWorker(trabajador.id)}
                className="ml-2 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {editMode ? "Editar Trabajador" : "Registrar Trabajador"}
        </h2>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <input
            type="text"
            name="rut"
            placeholder="RUT"
            value={formData.rut}
            onBlur={() => handleBlur("rut")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            name="dv"
            placeholder="DV"
            value={formData.dv}
            onBlur={() => handleBlur("dv")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded w-16"
          />
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onBlur={() => handleBlur("nombre")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            name="apellidop"
            placeholder="Apellido Paterno"
            value={formData.apellidop}
            onBlur={() => handleBlur("apellidop")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            name="apellidom"
            placeholder="Apellido Materno"
            value={formData.apellidom}
            onBlur={() => handleBlur("apellidom")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onBlur={() => handleBlur("email")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded"
          />
          <select
            name="cargo"
            value={formData.cargo}
            onBlur={() => handleBlur("cargo")}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">Seleccione un cargo</option>
            <option value="Profesor">Profesor</option>
            <option value="Inspector">Inspector</option>
            <option value="Director">Director</option>
            <option value="Inspector general">Inspector general</option>
            <option value="UTP">UTP</option>
            <option value="Auxiliar de aseo">Auxiliar de Aseo</option>
            <option value="Educadora de parvulos">Educadora de Párvulos</option>
            <option value="Tecnico de parvulos">Técnico de Párvulos</option>
            <option value="Psicologo">Psicólogo</option>
          </select>
        </div>
        <button
          onClick={addOrUpdateTrabajador}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          {editMode ? "Guardar Cambios" : "Registrar Trabajador"}
        </button>
        {editMode && (
          <button
            onClick={cancelEditMode}
            className="ml-2 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="mt-4">
            <h3 className="text-red-500 font-bold">Errores:</h3>
            <ul>
              {Object.values(errors).map((error, index) => (
                <li key={index} className="text-red-500">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const { data: trabajadores, error } = await supabase.from("trabajadores").select("*");
  return { props: { initialTrabajadores: trabajadores || [] } };
}