'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

type EstadoDeuda = 'Al día' | 'Mora leve' | 'Mora moderada' | 'Mora grave';

interface Tasa {
  codigo: string;
  nombre: string;
  porcentajeInteres: number;
}

interface PhoneEntry {
  code: string;
  number: string;
}

interface ClienteForm {
  codigoCliente: string;
  identidadCliente: string;
  nacionalidad: string;
  RTN: string;

  estadoCivil: string;
  nivelEducativo: string;

  nombre: string;
  apellido: string;
  email?: string;
  sexo: string;
  fechaNacimiento: string;

  departamentoResidencia: string;
  municipioResidencia: string;
  zonaResidencialCliente: string;
  direccion: string;
  tipoVivienda: string;
  antiguedadVivenda: string;
  direccionFotos: File[];

  telefono: string[];

  conyugeNombre: string;
  conyugeTelefono: string;
  conyugeDireccionFotos: File[];

  limiteCredito: string;
  tasaCliente: string;
  frecuenciaPago: string;
  estadoDeuda: EstadoDeuda;
  referencias: string[];
  refsParentescos: string[];
  refsParentescoTelefonos: string[];
  actividad: boolean;

  negocioNombre: string;
  negocioTipo: string;
  negocioTelefono: string;
  negocioDireccion: string;
  negocioDepartamento?: string;
  negocioMunicipio?: string;
  negocioZonaResidencial?: string;
  negocioParentesco?: string;
  negocioParentescoTelefono?: string;
  ventaDiaria?: string;
  capacidadPago?: string;

  documentosFotos: File[];
  negocioFotos: File[];
}

const steps = [
  'Información Personal',
  'Dirección y Cónyuge',
  'Financieros',
  'Referencias y Negocio',
];

const estadosCiviles = [
  'Soltero/a',
  'Casado/a',
  'Divorciado/a',
  'Viudo/a',
  'Unión Libre',
];

const nivelesEducativos = [
  'Primaria',
  'Secundaria',
  'Técnico',
  'Universitario',
  'Postgrado',
];

const frecuenciasPago = ['Semanal', 'Quincenal', 'Mensual'];

const sexos = ['Masculino', 'Femenino', 'Otro'];

const estadosDeuda: EstadoDeuda[] = [
  'Al día',
  'Mora leve',
  'Mora moderada',
  'Mora grave',
];

const departamentosHonduras = [
  'Atlántida',
  'Choluteca',
  'Colón',
  'Comayagua',
  'Copán',
  'Cortés',
  'El Paraíso',
  'Francisco Morazán',
  'Gracias a Dios',
  'Intibucá',
  'Islas de la Bahía',
  'La Paz',
  'Lempira',
  'Ocotepeque',
  'Olancho',
  'Santa Bárbara',
  'Valle',
  'Yoro',
];

const countryCodes = [
  { code: '+1', name: '🇺🇸 Estados Unidos' },
  { code: '+52', name: '🇲🇽 México' },
  { code: '+54', name: '🇦🇷 Argentina' },
  { code: '+55', name: '🇧🇷 Brasil' },
  { code: '+56', name: '🇨🇱 Chile' },
  { code: '+57', name: '🇨🇴 Colombia' },
  { code: '+58', name: '🇻🇪 Venezuela' },
  { code: '+51', name: '🇵🇪 Perú' },
  { code: '+503', name: '🇸🇻 El Salvador' },
  { code: '+504', name: '🇭🇳 Honduras' },
  { code: '+505', name: '🇳🇮 Nicaragua' },
  { code: '+506', name: '🇨🇷 Costa Rica' },
  { code: '+507', name: '🇵🇦 Panamá' },
  { code: '+508', name: '🇬🇹 Guatemala' },
  { code: '+509', name: '🇭🇹 Haití' },
  { code: '+591', name: '🇧🇴 Bolivia' },
  { code: '+592', name: '🇬🇾 Guyana' },
  { code: '+593', name: '🇪🇨 Ecuador' },
  { code: '+595', name: '🇵🇾 Paraguay' },
  { code: '+598', name: '🇺🇾 Uruguay' },
  { code: '+599', name: '🇨🇼 Curazao' },
];

// =========================
// Helper: genera el siguiente codigoCliente
// =========================
const nextCodigoFromExisting = (codigos: string[]) => {
  const parsed = codigos
    .map((c) => String(c || "").trim())
    .filter(Boolean)
    .map((c) => {
      const m = c.match(/(\d+)\s*$/); // números al final
      return {
        original: c,
        num: m ? parseInt(m[1], 10) : NaN,
        digitsLen: m ? m[1].length : 0,
        prefix: m ? c.slice(0, c.length - m[1].length) : "CLI-",
      };
    })
    .filter((x) => Number.isFinite(x.num));

  if (parsed.length === 0) {
    return "CLI-0001";
  }

  const maxItem = parsed.reduce((a, b) => (b.num > a.num ? b : a));
  const width = Math.max(4, maxItem.digitsLen || 0);

  const nextNum = maxItem.num + 1;
  const nextDigits = String(nextNum).padStart(width, "0");

  return `${maxItem.prefix}${nextDigits}`;
};


const NuevoClientePage: React.FC = () => {
  const router = useRouter();

  const [form, setForm] = useState<ClienteForm>({
    codigoCliente: '',
    identidadCliente: '',
    nacionalidad: 'Honduras',
    RTN: '',

    estadoCivil: 'Soltero/a',
    nivelEducativo: 'Secundaria',

    nombre: '',
    apellido: '',
    email: '',
    sexo: 'Masculino',
    fechaNacimiento: '',

    departamentoResidencia: 'Francisco Morazán',
    municipioResidencia: '',
    zonaResidencialCliente: '',
    direccion: '',
    tipoVivienda: '',
    antiguedadVivenda: '1',
    direccionFotos: [],

    telefono: [],

    conyugeNombre: '',
    conyugeTelefono: '',
    conyugeDireccionFotos: [],

    limiteCredito: '0',
    tasaCliente: '0',
    frecuenciaPago: 'Mensual',
    estadoDeuda: 'Al día',
    referencias: [''],
    refsParentescos: [''],
    refsParentescoTelefonos: [''],
    actividad: true,

    negocioNombre: '',
    negocioTipo: '',
    negocioTelefono: '',
    negocioDireccion: '',
    negocioParentesco: '',
    negocioParentescoTelefono: '',
    ventaDiaria: '0',
    capacidadPago: '0',

    documentosFotos: [],
    negocioFotos: [],
  });

  const [phoneEntries, setPhoneEntries] = useState<PhoneEntry[]>([
    { code: '+504', number: '' },
  ]);

  const [tasasBD, setTasasBD] = useState<Tasa[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const [emailError, setEmailError] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [apellidoError, setApellidoError] = useState('');
  const [identidadError, setIdentidadError] = useState('');

  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<'success' | 'error'>('success');
  // Teléfonos de negocio y referencias con mismo formato
  const [negocioPhoneEntry, setNegocioPhoneEntry] = useState<PhoneEntry>({
    code: '+504',
    number: '',
  });
  const [refsPhoneEntries, setRefsPhoneEntries] = useState<PhoneEntry[]>([
    { code: '+504', number: '' },
  ]);
  const [refsParientePhoneEntries, setRefsParientePhoneEntries] = useState<PhoneEntry[]>([
    { code: '+504', number: '' },
  ]);
  const [refsNames, setRefsNames] = useState<string[]>(['']);
  const [refsParentescosState, setRefsParentescosState] = useState<string[]>(['']);


  // Teléfono del cónyuge con mismo formato que teléfonos personales
  const [conyugePhoneEntry, setConyugePhoneEntry] = useState<PhoneEntry>({
    code: '+504',
    number: '',
  });

  useEffect(() => {
    (async () => {
      try {
        // Trae TODOS los clientes (activos o no)
        const clientes = await apiFetch<any[]>("/clientes");

        const codigos = (clientes || [])
          .map((c) => c?.codigoCliente)
          .filter(Boolean);

        const nextCodigo = nextCodigoFromExisting(codigos);

        setForm((prev) => ({
          ...prev,
          codigoCliente: nextCodigo,
        }));
      } catch (err) {
        console.error("Error generando codigoCliente desde backend:", err);

        // Fallback si falla el GET
        setForm((prev) => ({
          ...prev,
          codigoCliente: `CLI-${Date.now()}`,
        }));
      }
    })();
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<any[]>('/tasas');
        const tasas = (data || []).map((t: any) => ({
          codigo: t.codigoTasa,
          nombre: t.nombre,
          porcentajeInteres: t.porcentajeInteres,
        }));
        setTasasBD(tasas);
      } catch (err) {
        console.error('Error cargando tasas:', err);
        setTasasBD([]);
      }
    })();
  }, []);

  useEffect(() => {
    const phones = phoneEntries
      .map((pe) => `${pe.code} ${pe.number}`.trim())
      .filter((p) => p.replace(/\D/g, '').length > 0);
    setForm((prev) => ({ ...prev, telefono: phones }));
  }, [phoneEntries]);

  // Mantener `form.conyugeTelefono` sincronizado como "<code> <number>"
  useEffect(() => {
    const composed = `${conyugePhoneEntry.code} ${conyugePhoneEntry.number}`.trim();
    setForm((prev) => ({ ...prev, conyugeTelefono: composed }));
  }, [conyugePhoneEntry]);

  useEffect(() => {
    const composed = `${negocioPhoneEntry.code} ${negocioPhoneEntry.number}`.trim();
    setForm((prev) => ({ ...prev, negocioTelefono: composed }));
  }, [negocioPhoneEntry]);

  useEffect(() => {
    const refs = refsPhoneEntries.map((r, idx) => {
      const phone = `${r.code} ${r.number}`.trim();
      const name = (refsNames[idx] || '').trim();
      const parentesco = (refsParentescosState[idx] || '').trim();
      const nameWithParen = parentesco ? `${name} (${parentesco})` : name;
      return nameWithParen ? `${nameWithParen} - ${phone}` : phone;
    });
    const parientePhones = refsParientePhoneEntries.map((p) => `${p.code} ${p.number}`.trim());
    setForm((prev) => ({ ...prev, referencias: refs, refsParentescoTelefonos: parientePhones }));
  }, [refsPhoneEntries]);

  useEffect(() => {
    const refs = refsPhoneEntries.map((r, idx) => {
      const phone = `${r.code} ${r.number}`.trim();
      const name = (refsNames[idx] || '').trim();
      const parentesco = (refsParentescosState[idx] || '').trim();
      const nameWithParen = parentesco ? `${name} (${parentesco})` : name;
      return nameWithParen ? `${nameWithParen} - ${phone}` : phone;
    });
    const parientePhones = refsParientePhoneEntries.map((p) => `${p.code} ${p.number}`.trim());
    setForm((prev) => ({ ...prev, referencias: refs, refsParentescoTelefonos: parientePhones }));
  }, [refsNames]);

  useEffect(() => {
    const refs = refsPhoneEntries.map((r, idx) => {
      const phone = `${r.code} ${r.number}`.trim();
      const name = (refsNames[idx] || '').trim();
      const parentesco = (refsParentescosState[idx] || '').trim();
      const nameWithParen = parentesco ? `${name} (${parentesco})` : name;
      return nameWithParen ? `${nameWithParen} - ${phone}` : phone;
    });
    const parientePhones = refsParientePhoneEntries.map((p) => `${p.code} ${p.number}`.trim());
    setForm((prev) => ({ ...prev, referencias: refs, refsParentescos: [...refsParentescosState], refsParentescoTelefonos: parientePhones }));
  }, [refsParentescosState]);

  const handleChange = <K extends keyof ClienteForm>(
    key: K,
    value: ClienteForm[K],
  ) => {
    setForm((s) => ({ ...s, [key]: value }));

    if (key === 'email') validateEmail(value as string);
    else if (key === 'nombre') validateNombre(value as string);
    else if (key === 'apellido') validateApellido(value as string);
    else if (key === 'identidadCliente') validateIdentidad(value as string);
  };

  const validateEmail = (email: string) => {
    // Email es opcional; si está vacío, es válido
    if (!email) {
      setEmailError('');
      return true;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Ingrese un email válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateNombre = (nombre: string) => {
    if (!nombre) {
      setNombreError('El nombre es requerido');
      return false;
    }
    if (/[0-9]/.test(nombre)) {
      setNombreError('El nombre no puede contener números');
      return false;
    }
    setNombreError('');
    return true;
  };

  const validateApellido = (apellido: string) => {
    if (!apellido) {
      setApellidoError('El apellido es requerido');
      return false;
    }
    if (/[0-9]/.test(apellido)) {
      setApellidoError('El apellido no puede contener números');
      return false;
    }
    setApellidoError('');
    return true;
  };

  const validateIdentidad = (identidad: string) => {
    if (!identidad) {
      setIdentidadError('La identidad es requerida');
      return false;
    }
    if (!/^\d+$/.test(identidad)) {
      setIdentidadError('La identidad solo puede contener números');
      return false;
    }
    if (identidad.length > 13) {
      setIdentidadError('La identidad no puede exceder 13 dígitos');
      return false;
    }
    setIdentidadError('');
    return true;
  };

  const isAdult18 = (dateStr: string) => {
    if (!dateStr) return false;
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    const eighteen = new Date(
      dob.getFullYear() + 18,
      dob.getMonth(),
      dob.getDate(),
    );
    return today >= eighteen;
  };

  const handlePhoneEntryChange = (
    index: number,
    field: 'code' | 'number',
    value: string,
  ) => {
    setPhoneEntries((prev) => {
      const next = [...prev];
      if (field === 'code') next[index] = { ...next[index], code: value };
      else
        next[index] = {
          ...next[index],
          number: value.replace(/[^\d]/g, '').slice(0, 8),
        };
      return next;
    });

  const handleReferenciaParientePhoneChange = (
    index: number,
    field: 'code' | 'number',
    value: string,
  ) => {
    setRefsParientePhoneEntries((prev) => {
      const next = [...prev];
      next[index] =
        field === 'code'
          ? { ...next[index], code: value }
          : { ...next[index], number: value.replace(/[^\d]/g, '').slice(0, 8) };
      return next;
    });
  };
  };

  const handleConyugePhoneChange = (
    field: 'code' | 'number',
    value: string,
  ) => {
    setConyugePhoneEntry((prev) =>
      field === 'code'
        ? { ...prev, code: value }
        : { ...prev, number: value.replace(/[^\d]/g, '').slice(0, 8) },
    );
  };

  const handleNegocioPhoneChange = (
    field: 'code' | 'number',
    value: string,
  ) => {
    setNegocioPhoneEntry((prev) =>
      field === 'code'
        ? { ...prev, code: value }
        : { ...prev, number: value.replace(/[^\d]/g, '').slice(0, 8) },
    );
  };

  const handleReferenciaPhoneChange = (
    index: number,
    field: 'code' | 'number',
    value: string,
  ) => {
    setRefsPhoneEntries((prev) => {
      const next = [...prev];
      next[index] =
        field === 'code'
          ? { ...next[index], code: value }
          : { ...next[index], number: value.replace(/[^\d]/g, '').slice(0, 8) };
      return next;
    });
  };



  const addPhoneEntry = () => {
    setPhoneEntries((prev) =>
      prev.length < 3 ? [...prev, { code: '+504', number: '' }] : prev,
    );
  };

  const removePhoneEntry = (index: number) => {
    setPhoneEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setForm((prev) => ({
      ...prev,
      documentosFotos: [...prev.documentosFotos, ...(files as File[])],
    }));
  };

  const handleNegocioFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setForm((prev) => ({
      ...prev,
      negocioFotos: [...prev.negocioFotos, ...(files as File[])],
    }));
  };

  const removeDocumentoFoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      documentosFotos: prev.documentosFotos.filter((_, i) => i !== index),
    }));
  };

  const removeNegocioFoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      negocioFotos: prev.negocioFotos.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    let isValid = true;

    if (activeStep === 0) {
      if (!validateNombre(form.nombre)) isValid = false;
      if (!validateApellido(form.apellido)) isValid = false;
      if (!validateEmail(form.email)) isValid = false;
      if (!validateIdentidad(form.identidadCliente)) isValid = false;
      if (!form.nacionalidad.trim()) {
        alert('La nacionalidad es requerida');
        isValid = false;
      }
      if (!form.fechaNacimiento) {
        alert('La fecha de nacimiento es requerida');
        isValid = false;
      } else if (!isAdult18(form.fechaNacimiento)) {
        alert('El cliente debe ser mayor de 18 años');
        isValid = false;
      }
      // Teléfono personal obligatorio: al menos uno con 8 dígitos
      const anyValidPersonal = phoneEntries.some(
        (p) => p.number.replace(/[^\d]/g, '').length === 8,
      );
      if (!anyValidPersonal) {
        alert('Debe ingresar al menos un teléfono personal de 8 dígitos');
        isValid = false;
      }
    } else if (activeStep === 1) {
      if (!form.tipoVivienda.trim()) {
        alert('El tipo de vivienda es requerido');
        isValid = false;
      }
      if (Number(form.antiguedadVivenda) <= 0) {
        alert('La antigüedad de vivienda debe ser mayor a 0 años');
        isValid = false;
      }
      if (!form.departamentoResidencia.trim()) {
        alert('El departamento de residencia es requerido');
        isValid = false;
      }
      if (!form.municipioResidencia.trim()) {
        alert('El municipio es requerido');
        isValid = false;
      }
      if (!form.zonaResidencialCliente.trim()) {
        alert('La zona residencial es requerida');
        isValid = false;
      }
      if (!form.direccion.trim()) {
        alert('La dirección es requerida');
        isValid = false;
      }
      // Requerir al menos una foto de dirección
      if (!form.direccionFotos || form.direccionFotos.length === 0) {
        alert('Debe adjuntar al menos una foto de la dirección');
        isValid = false;
      }
      // Teléfono del cónyuge opcional: si se ingresa, debe ser de 8 dígitos
      const spouseDigits = conyugePhoneEntry.number.replace(/[^\d]/g, '');
      if (spouseDigits.length > 0 && spouseDigits.length !== 8) {
        alert('El teléfono del cónyuge debe tener exactamente 8 dígitos');
        isValid = false;
      }
    } else if (activeStep === 2) {
      if (Number(form.limiteCredito) < 0) {
        alert('El límite de crédito debe ser mayor o igual a 0');
        isValid = false;
      }
      if (Number(form.tasaCliente) < 0) {
        alert('La tasa debe ser mayor o igual a 0');
        isValid = false;
      }
    }

    if (isValid) {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    // Validaciones finales básicas
    if (
      !validateNombre(form.nombre) ||
      !validateApellido(form.apellido) ||
      !validateEmail(form.email) ||
      !validateIdentidad(form.identidadCliente)
    ) {
      alert('Por favor corrija los errores en los campos');
      return;
    }

    if (Number(form.antiguedadVivenda) <= 0) {
      alert('La antigüedad de vivienda debe ser mayor a 0 años');
      return;
    }

    if (!form.direccionFotos || form.direccionFotos.length === 0) {
      alert('Debe adjuntar al menos una foto de la dirección');
      return;
    }

    if (
      form.RTN &&
      (!/^\d+$/.test(form.RTN) || String(form.RTN).length > 14)
    ) {
      alert('RTN debe ser numérico y no exceder 14 dígitos');
      return;
    }

    if (Number(form.limiteCredito) < 0 || Number(form.tasaCliente) < 0) {
      alert('Los valores financieros deben ser mayores o iguales a 0');
      return;
    }

    // Teléfono personal obligatorio
    const anyValidPersonal = phoneEntries.some(
      (p) => p.number.replace(/[^\d]/g, '').length === 8
    );
    if (!anyValidPersonal) {
      alert('Debe ingresar al menos un teléfono personal de 8 dígitos');
      return;
    }

    // Cónyuge opcional: si existe, debe ser válido
    const spouseDigits = conyugePhoneEntry.number.replace(/[^\d]/g, '');
    if (spouseDigits.length > 0 && spouseDigits.length !== 8) {
      alert('El teléfono del cónyuge debe tener exactamente 8 dígitos');
      return;
    }

    /**
     * 🔥 PAYLOAD ALINEADO AL BACKEND (MONGOOSE)
     */
    const payload = {
      codigoCliente: form.codigoCliente,
      identidadCliente: form.identidadCliente,
      nacionalidad: form.nacionalidad,
      RTN: form.RTN || undefined,

      estadoCivil: form.estadoCivil,
      nivelEducativo: form.nivelEducativo,

      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email || undefined,
      sexo: form.sexo,
      fechaNacimiento: form.fechaNacimiento,

      // Dirección
      departamentoResidencia: form.departamentoResidencia,
      municipioResidencia: form.municipioResidencia,
      zonaResidencialCliente: form.zonaResidencialCliente,
      direccion: form.direccion,
      tipoVivienda: form.tipoVivienda,
      antiguedadVivenda: Number(form.antiguedadVivenda),
      fotosDireccion: (form.direccionFotos || []).map((f) => f.name),

      // Contacto
      telefono: form.telefono,

      // Cónyuge
      conyugeNombre: form.conyugeNombre || undefined,
      conyugeTelefono: form.conyugeTelefono || undefined,

      // Financieros
      limiteCredito: Number(form.limiteCredito),
      tasaCliente: Number(form.tasaCliente),
      frecuenciaPago: form.frecuenciaPago,

      // 🔑 Backend field (antes estadoDeuda en el UI)
      riesgoMora: form.estadoDeuda,

      // Referencias
      referencias: form.referencias.filter((r) => r.trim() !== ''),
      refsParentescoTelefonos: (form.refsParentescoTelefonos || []).filter((t) => t && t.replace(/\s/g, '').length > 0),

      // 🔑 Backend field (antes actividad en el UI)
      activo: form.actividad,

      // Negocio (NO usamos dirección)
      negocioNombre: form.negocioNombre || undefined,
      negocioTipo: form.negocioTipo || undefined,
      negocioTelefono: form.negocioTelefono || undefined,
      negocioDepartamento: form.negocioDepartamento || undefined,
      negocioMunicipio: form.negocioMunicipio || undefined,
      negocioZonaResidencial: form.negocioZonaResidencial || undefined,
      negocioParentesco: form.negocioParentesco || undefined,
      negocioParentescoTelefono: form.negocioParentescoTelefono || undefined,
      ventaDiaria: form.ventaDiaria ? Number(form.ventaDiaria) : undefined,
      capacidadPago: form.capacidadPago ? Number(form.capacidadPago) : undefined,

      // Fotos (enviamos nombres de archivo por ahora)
      fotosDocs: form.documentosFotos.map((f) => f.name),
      fotosNegocio: form.negocioFotos.map((f) => f.name),
      fotosDireccionConyuge: (form.conyugeDireccionFotos || []).map((f) => f.name),
      // Cobrador asociado (id)
    };

    setSaving(true);

    try {
      console.log("codigoCliente enviado:", form.codigoCliente);
      await apiFetch('/clientes/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSnackbarSeverity('success');
      setSnackbarMsg('Cliente registrado correctamente.');
      setSnackbarOpen(true);


      router.push('/clientes');
    } catch (err) {
      console.error(err);
      setSnackbarSeverity('error');
      setSnackbarMsg('Error al registrar el cliente.');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };


  const handleCancel = () => {
    router.push('/clientes');
  };

  const handleCloseSnackbar = (
    _: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const setEstadoDeuda = (estado: EstadoDeuda) => {
    handleChange('estadoDeuda', estado);
  };

  const handleReferenciaChange = (index: number, value: string) => {
    const newRefs = [...form.referencias];
    newRefs[index] = value;
    handleChange('referencias', newRefs);
  };

  const addReferencia = () => {
    setRefsPhoneEntries((prev) => [...prev, { code: '+504', number: '' }]);
    setRefsParientePhoneEntries((prev) => [...prev, { code: '+504', number: '' }]);
    setRefsNames((prev) => [...prev, '']);
    setRefsParentescosState((prev) => [...prev, '']);
  };

  const removeReferencia = (index: number) => {
    setRefsPhoneEntries((prev) => prev.filter((_, i) => i !== index));
    setRefsParientePhoneEntries((prev) => prev.filter((_, i) => i !== index));
    setRefsNames((prev) => prev.filter((_, i) => i !== index));
    setRefsParentescosState((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReferenciaNameChange = (index: number, value: string) => {
    setRefsNames((prev) => {
      const next = [...prev];
      next[index] = value.replace(/[\d]/g, '');
      return next;
    });
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h6">Nuevo cliente</Typography>
            <Typography variant="caption" color="text.secondary">
              Registra un nuevo cliente con toda su información personal,
              residencial y financiera.
            </Typography>
          </Box>

          <Button variant="outlined" size="small" onClick={handleCancel}>
            Volver
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mt: 3,
            }}
          >
            {/* PASO 0: INFO PERSONAL */}
            {activeStep === 0 && (
              <>
                <TextField
                  label="Identidad (DNI)"
                  value={form.identidadCliente}
                  onChange={(e) => {
                    const numericValue = e.target.value
                      .replace(/[^\d]/g, '')
                      .slice(0, 13);
                    handleChange('identidadCliente', numericValue);
                  }}
                  required
                  margin="normal"
                  error={!!identidadError}
                  helperText={identidadError || 'Solo números, máximo 13 dígitos'}
                />

                <TextField
                  label="Nacionalidad"
                  value={form.nacionalidad}
                  onChange={(e) => handleChange('nacionalidad', e.target.value)}
                  required
                  margin="normal"
                />

                <TextField
                  label="RTN (opcional)"
                  value={form.RTN}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, '').slice(0, 14);
                    handleChange('RTN', v);
                  }}
                  margin="normal"
                  helperText="Solo números, máximo 14 dígitos"
                />

                <FormControl margin="normal">
                  <InputLabel id="estado-civil-label">
                    Estado Civil
                  </InputLabel>
                  <Select
                    labelId="estado-civil-label"
                    value={form.estadoCivil}
                    label="Estado Civil"
                    onChange={(e) =>
                      handleChange('estadoCivil', e.target.value as string)
                    }
                  >
                    {estadosCiviles.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl margin="normal">
                  <InputLabel id="nivel-educativo-label">
                    Nivel Educativo
                  </InputLabel>
                  <Select
                    labelId="nivel-educativo-label"
                    value={form.nivelEducativo}
                    label="Nivel Educativo"
                    onChange={(e) =>
                      handleChange('nivelEducativo', e.target.value as string)
                    }
                  >
                    {nivelesEducativos.map((nivel) => (
                      <MenuItem key={nivel} value={nivel}>
                        {nivel}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => {
                    const textOnly = e.target.value.replace(/[0-9]/g, '');
                    handleChange('nombre', textOnly);
                  }}
                  required
                  margin="normal"
                  error={!!nombreError}
                  helperText={nombreError}
                />

                <TextField
                  label="Apellido"
                  value={form.apellido}
                  onChange={(e) => {
                    const textOnly = e.target.value.replace(/[0-9]/g, '');
                    handleChange('apellido', textOnly);
                  }}
                  required
                  margin="normal"
                  error={!!apellidoError}
                  helperText={apellidoError}
                />

                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  margin="normal"
                  error={!!emailError}
                  helperText={emailError || 'Ejemplo: usuario@dominio.com'}
                />

                <FormControl margin="normal">
                  <InputLabel id="sexo-label">Sexo</InputLabel>
                  <Select
                    labelId="sexo-label"
                    value={form.sexo}
                    label="Sexo"
                    onChange={(e) =>
                      handleChange('sexo', e.target.value as string)
                    }
                  >
                    {sexos.map((sexo) => (
                      <MenuItem key={sexo} value={sexo}>
                        {sexo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) =>
                    handleChange('fechaNacimiento', e.target.value)
                  }
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 1 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Teléfonos (máximo 3)
                  </Typography>
                  {phoneEntries.map((entry, idx) => (
                    <Box
                      key={`phone-${idx}`}
                      sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}
                    >
                      <FormControl sx={{ minWidth: 140 }}>
                        <InputLabel id={`country-code-${idx}`}>País</InputLabel>
                        <Select
                          labelId={`country-code-${idx}`}
                          value={entry.code}
                          label="País"
                          onChange={(e) =>
                            handlePhoneEntryChange(idx, 'code', e.target.value as string)
                          }
                          size="small"
                        >
                          {countryCodes.map((c) => (
                            <MenuItem key={c.code} value={c.code}>
                              {c.name} ({c.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        value={entry.number}
                        onChange={(e) =>
                          handlePhoneEntryChange(idx, 'number', e.target.value)
                        }
                        placeholder="XXXX-XXXX"
                        size="small"
                        sx={{ flex: 1 }}
                        helperText="Ingrese solo números"
                      />
                      <IconButton
                        aria-label="remove"
                        onClick={() => removePhoneEntry(idx)}
                        disabled={phoneEntries.length === 1}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addPhoneEntry}
                    disabled={phoneEntries.length >= 3}
                    size="small"
                  >
                    Agregar Teléfono
                  </Button>
                </Box>
              </>
            )}

            {/* PASO 1: DIRECCIÓN + CÓNYUGE */}
            {activeStep === 1 && (
              <>
                <TextField
                  label="Departamento"
                  value={form.departamentoResidencia}
                  onChange={(e) =>
                    handleChange('departamentoResidencia', e.target.value)
                  }
                  required
                  margin="normal"
                />

                <TextField
                  label="Municipio"
                  value={form.municipioResidencia}
                  onChange={(e) =>
                    handleChange('municipioResidencia', e.target.value)
                  }
                  required
                  margin="normal"
                />

                <TextField
                  label="Zona residencial"
                  value={form.zonaResidencialCliente}
                  onChange={(e) =>
                    handleChange('zonaResidencialCliente', e.target.value)
                  }
                  required
                  margin="normal"
                />

                <TextField
                  label="Tipo de vivienda"
                  value={form.tipoVivienda}
                  onChange={(e) => handleChange('tipoVivienda', e.target.value)}
                  required
                  margin="normal"
                />

                <TextField
                  label="Antigüedad vivienda (años)"
                  type="number"
                  value={form.antiguedadVivenda}
                  onChange={(e) =>
                    handleChange(
                      'antiguedadVivenda',
                      String(Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                  required
                  margin="normal"
                  inputProps={{ min: 1 }}
                />

                <TextField
                  label="Dirección (colonia, barrio, aldea)"
                  value={form.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  required
                  margin="normal"
                  fullWidth
                  sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
                />
                {/* Foto(s) de dirección */}
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 1 }}>
                  <Typography variant="subtitle2">Foto(s) de dirección</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Cargar foto de dirección
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setForm((prev) => ({
                          ...prev,
                          direccionFotos: [...(prev.direccionFotos || []), ...(files as File[])],
                        }));
                      }}
                    />
                  </Button>
                  {(form.direccionFotos || []).length > 0 && (
                    <List dense>
                      {(form.direccionFotos || []).map((f, idx) => (
                        <ListItem
                          key={idx}
                          sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="eliminar"
                              size="small"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  direccionFotos: (prev.direccionFotos || []).filter((_, i) => i !== idx),
                                }))
                              }
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={f.name} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 2 }}>
                  <Typography variant="subtitle2">Datos del cónyuge</Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Nombre del cónyuge"
                        value={form.conyugeNombre}
                        onChange={(e) => {
                          const textOnly = e.target.value.replace(/[0-9]/g, '');
                          handleChange('conyugeNombre', textOnly);
                        }}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <FormControl sx={{ minWidth: 140 }} size="small">
                          <InputLabel id="conyuge-country-code">País</InputLabel>
                          <Select
                            labelId="conyuge-country-code"
                            value={conyugePhoneEntry.code}
                            label="País"
                            onChange={(e) =>
                              handleConyugePhoneChange('code', e.target.value as string)
                            }
                          >
                            {countryCodes.map((c) => (
                              <MenuItem key={c.code} value={c.code}>
                                {c.name} ({c.code})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          value={conyugePhoneEntry.number}
                          onChange={(e) =>
                            handleConyugePhoneChange('number', e.target.value)
                          }
                          placeholder="XXXX-XXXX"
                          size="small"
                          sx={{ flex: 1 }}
                          helperText="Ingrese solo 8 números"
                          error={conyugePhoneEntry.number.replace(/[^\d]/g, '').length !== 8 && conyugePhoneEntry.number.length > 0}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12 }}>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">Foto(s) de dirección del cónyuge (opcional)</Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          Cargar foto de dirección del cónyuge
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);
                              setForm((prev) => ({
                                ...prev,
                                conyugeDireccionFotos: [...(prev.conyugeDireccionFotos || []), ...(files as File[])],
                              }));
                            }}
                          />
                        </Button>
                        {(form.conyugeDireccionFotos || []).length > 0 && (
                          <List dense>
                            {(form.conyugeDireccionFotos || []).map((f, idx) => (
                              <ListItem
                                key={idx}
                                sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    aria-label="eliminar"
                                    size="small"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        conyugeDireccionFotos: (prev.conyugeDireccionFotos || []).filter((_, i) => i !== idx),
                                      }))
                                    }
                                  >
                                    <RemoveCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                }
                              >
                                <ListItemText primary={f.name} />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}

            {/* PASO 2: FINANCIEROS */}
            {activeStep === 2 && (
              <>
                <TextField
                  label="Límite de crédito"
                  type="number"
                  value={form.limiteCredito}
                  onChange={(e) =>
                    handleChange(
                      'limiteCredito',
                      String(Math.max(0, Number(e.target.value) || 0)),
                    )
                  }
                  required
                  margin="normal"
                  inputProps={{ min: 0 }}
                />

                <FormControl margin="normal" fullWidth>
                  <InputLabel id="tasa-label">Tasa (%)</InputLabel>
                  <Select
                    labelId="tasa-label"
                    value={
                      tasasBD.find(
                        (t) => String(t.porcentajeInteres) === form.tasaCliente,
                      )?.codigo || ''
                    }
                    label="Tasa (%)"
                    onChange={(e) => {
                      const selectedCodigo = e.target.value;
                      const tasaSeleccionada = tasasBD.find(
                        (t) => t.codigo === selectedCodigo,
                      );
                      handleChange(
                        'tasaCliente',
                        String(tasaSeleccionada?.porcentajeInteres ?? '0'),
                      );
                    }}
                  >
                    {tasasBD.map((t) => (
                      <MenuItem key={t.codigo} value={t.codigo}>
                        {t.nombre} - {t.porcentajeInteres}%
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl margin="normal">
                  <InputLabel id="frecuencia-pago-label">
                    Frecuencia de pago
                  </InputLabel>
                  <Select
                    labelId="frecuencia-pago-label"
                    value={form.frecuenciaPago}
                    label="Frecuencia de pago"
                    onChange={(e) =>
                      handleChange('frecuenciaPago', e.target.value as string)
                    }
                  >
                    {frecuenciasPago.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 2 }}>
                  <Typography variant="subtitle2">Estado de deuda</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {estadosDeuda.map((estado) => (
                      <FormControlLabel
                        key={estado}
                        control={
                          <Checkbox
                            checked={form.estadoDeuda === estado}
                            onChange={() => setEstadoDeuda(estado)}
                          />
                        }
                        label={estado}
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* PASO 3: REFERENCIAS + NEGOCIO + FOTOS */}
            {activeStep === 3 && (
              <>
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                  <Typography variant="subtitle2">Referencias (teléfonos)</Typography>
                  {refsPhoneEntries.map((ref, index) => (
                    <Box
                      key={`ref-${index}`}
                      sx={{ display: 'center', gap: 1, alignItems: 'center', mt: 1 }}
                    >
                      <TextField
                        label={`Nombre referencia ${index + 1}`}
                        value={refsNames[index] || ''}
                        onChange={(e) =>
                          handleReferenciaNameChange(index, e.target.value)
                        }
                        size="small"
                        sx={{ minWidth: 220 }}
                      />
                      <TextField
                        label={`Parentesco referencia ${index + 1}`}
                        value={refsParentescosState[index] || ''}
                        onChange={(e) =>
                          setRefsParentescosState((prev) => {
                            const next = [...prev];
                            next[index] = e.target.value;
                            return next;
                          })
                        }
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <FormControl sx={{ minWidth: 140 }} size="small">
                        <InputLabel id={`ref-pariente-country-${index}`}>País</InputLabel>
                        <Select
                          labelId={`ref-pariente-country-${index}`}
                          value={refsParientePhoneEntries[index]?.code || '+504'}
                          label="País"
                          onChange={(e) =>
                            handleReferenciaParientePhoneChange(index, 'code', e.target.value as string)
                          }
                        >
                          {countryCodes.map((c) => (
                            <MenuItem key={c.code} value={c.code}>
                              {c.name} ({c.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        value={refsParientePhoneEntries[index]?.number || ''}
                        onChange={(e) =>
                          handleReferenciaParientePhoneChange(index, 'number', e.target.value)
                        }
                        placeholder="XXXX-XXXX"
                        size="small"
                        sx={{ flex: 1 }}
                        helperText="Teléfono del pariente (8 dígitos)"
                        error={
                          (refsParientePhoneEntries[index]?.number || '').replace(/[^\d]/g, '').length > 0 &&
                          (refsParientePhoneEntries[index]?.number || '').replace(/[^\d]/g, '').length !== 8
                        }
                      />
                      <FormControl sx={{ minWidth: 140 }} size="small">
                        <InputLabel id={`ref-country-${index}`}>País</InputLabel>
                        <Select
                          labelId={`ref-country-${index}`}
                          value={ref.code}
                          label="País"
                          onChange={(e) =>
                            handleReferenciaPhoneChange(index, 'code', e.target.value as string)
                          }
                        >
                          {countryCodes.map((c) => (
                            <MenuItem key={c.code} value={c.code}>
                              {c.name} ({c.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        value={ref.number}
                        onChange={(e) =>
                          handleReferenciaPhoneChange(index, 'number', e.target.value)
                        }
                        placeholder="XXXX-XXXX"
                        size="small"
                        sx={{ flex: 1 }}
                        helperText="Ingrese solo 8 números"
                        error={ref.number.replace(/[^\d]/g, '').length > 0 && ref.number.replace(/[^\d]/g, '').length !== 8}
                      />
                      {index > 0 && (
                        <IconButton
                          onClick={() => removeReferencia(index)}
                          color="error"
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addReferencia}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Agregar referencia
                  </Button>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.actividad}
                      onChange={(e) =>
                        handleChange('actividad', e.target.checked)
                      }
                    />
                  }
                  label="Cliente activo"
                  sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 1 }}
                />

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 2 }}>
                  <Typography variant="subtitle2">
                    Fotografías de documentos
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Cargar fotos de documentos
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleDocumentosChange}
                    />
                  </Button>
                  {form.documentosFotos.length > 0 && (
                    <List dense>
                      {form.documentosFotos.map((f, idx) => (
                        <ListItem
                          key={idx}
                          sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="eliminar"
                              size="small"
                              onClick={() => removeDocumentoFoto(idx)}
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={f.name} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 3 }}>
                  <Typography variant="subtitle2">Datos del negocio</Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Nombre del negocio"
                        value={form.negocioNombre}
                        onChange={(e) =>
                          handleChange('negocioNombre', e.target.value)
                        }
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Tipo de negocio"
                        value={form.negocioTipo}
                        onChange={(e) =>
                          handleChange('negocioTipo', e.target.value)
                        }
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Parentesco del propietario"
                        value={form.negocioParentesco || ''}
                        onChange={(e) => handleChange('negocioParentesco', e.target.value)}
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <FormControl sx={{ minWidth: 140 }} size="small">
                          <InputLabel id="negocio-pariente-country-code">País</InputLabel>
                          <Select
                            labelId="negocio-pariente-country-code"
                            value={(form.negocioParentescoTelefono || '+504').split(' ')[0]}
                            label="País"
                            onChange={(e) => {
                              const digits = (form.negocioParentescoTelefono || '').replace(/[^\d]/g, '').slice(-8);
                              handleChange('negocioParentescoTelefono', `${e.target.value as string} ${digits}`);
                            }}
                          >
                            {countryCodes.map((c) => (
                              <MenuItem key={c.code} value={c.code}>
                                {c.name} ({c.code})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          value={(form.negocioParentescoTelefono || '').replace(/^\+\d{1,4}\s*/, '')}
                          onChange={(e) => handleChange('negocioParentescoTelefono', `${(form.negocioParentescoTelefono || '+504').split(' ')[0]} ${e.target.value.replace(/[^\d]/g, '').slice(0, 8)}`)}
                          placeholder="XXXX-XXXX"
                          size="small"
                          sx={{ flex: 1 }}
                          helperText="Teléfono del pariente (8 dígitos)"
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <FormControl sx={{ minWidth: 140 }} size="small">
                          <InputLabel id="negocio-country-code">País</InputLabel>
                          <Select
                            labelId="negocio-country-code"
                            value={negocioPhoneEntry.code}
                            label="País"
                            onChange={(e) =>
                              handleNegocioPhoneChange('code', e.target.value as string)
                            }
                          >
                            {countryCodes.map((c) => (
                              <MenuItem key={c.code} value={c.code}>
                                {c.name} ({c.code})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          value={negocioPhoneEntry.number}
                          onChange={(e) =>
                            handleNegocioPhoneChange('number', e.target.value)
                          }
                          placeholder="XXXX-XXXX"
                          size="small"
                          sx={{ flex: 1 }}
                          helperText="Ingrese solo 8 números"
                          error={negocioPhoneEntry.number.replace(/[^\d]/g, '').length > 0 && negocioPhoneEntry.number.replace(/[^\d]/g, '').length !== 8}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Venta diaria"
                        type="number"
                        value={form.ventaDiaria || ''}
                        onChange={(e) => handleChange('ventaDiaria', String(Math.max(0, Number(e.target.value) || 0)))}
                        fullWidth
                        margin="normal"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Capacidad de pago"
                        type="number"
                        value={form.capacidadPago || ''}
                        onChange={(e) => handleChange('capacidadPago', String(Math.max(0, Number(e.target.value) || 0)))}
                        fullWidth
                        margin="normal"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Departamento"
                        value={form.negocioDepartamento || ''}
                        onChange={(e) => handleChange('negocioDepartamento', e.target.value as string)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Municipio"
                        value={form.negocioMunicipio || ''}
                        onChange={(e) => handleChange('negocioMunicipio', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Zona residencial"
                        value={form.negocioZonaResidencial || ''}
                        onChange={(e) => handleChange('negocioZonaResidencial', e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Cargar fotos del negocio
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleNegocioFotosChange}
                    />
                  </Button>
                  {form.negocioFotos.length > 0 && (
                    <List dense>
                      {form.negocioFotos.map((f, idx) => (
                        <ListItem
                          key={idx}
                          sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="eliminar"
                              size="small"
                              onClick={() => removeNegocioFoto(idx)}
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={f.name} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* Botones */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
              mt: 3,
            }}
          >
            <Button onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={saving}>
                Atrás
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={saving}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar cliente'}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NuevoClientePage;
