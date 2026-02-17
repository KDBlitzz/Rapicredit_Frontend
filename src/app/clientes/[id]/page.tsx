
'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Snackbar,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useParams } from 'next/navigation';
import { useClienteDetalle } from '../../../hooks/useClienteDetalle';
import { uploadImageFiles } from '../../../lib/imageUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

type EstadoDeuda = 'Al día' | 'Mora leve' | 'Mora moderada' | 'Mora grave';

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

const isHttpUrl = (value: string) => /^https?:\/\//i.test(String(value));

const UrlPreviewGrid: React.FC<{ items: string[]; altPrefix: string }> = ({ items, altPrefix }) => {
  const urls = (items || []).filter((v) => isHttpUrl(v));
  if (urls.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {urls.map((u, idx) => (
        <Box
          key={`${altPrefix}-${idx}`}
          component="a"
          href={u}
          target="_blank"
          rel="noreferrer"
          sx={{ display: 'inline-flex' }}
        >
          <Box
            component="img"
            src={u}
            alt={`${altPrefix}-${idx + 1}`}
            loading="lazy"
            sx={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
          />
        </Box>
      ))}
    </Box>
  );
};

const FilePreviewGrid: React.FC<{ files: File[]; altPrefix: string }> = ({ files, altPrefix }) => {
  const urls = useMemo(() => {
    return (files || []).map((f) => URL.createObjectURL(f));
  }, [files]);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  if (!files || files.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {urls.map((u, idx) => (
        <Box
          key={`${altPrefix}-${idx}`}
          component="a"
          href={u}
          target="_blank"
          rel="noreferrer"
          sx={{ display: 'inline-flex' }}
        >
          <Box
            component="img"
            src={u}
            alt={`${altPrefix}-${idx + 1}`}
            loading="lazy"
            sx={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
          />
        </Box>
      ))}
    </Box>
  );
};

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

const EditarClientePage: React.FC = () => {
  const router = useRouter();

  const params = useParams();
  const codigoClienteParam = params?.id as string | undefined;

  const { data: clienteData } = useClienteDetalle(codigoClienteParam ?? '');

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
  const [activeStep, setActiveStep] = useState(0);

  const [emailError, setEmailError] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [apellidoError, setApellidoError] = useState('');
  const [identidadError, setIdentidadError] = useState('');
  const [fechaNacimientoError, setFechaNacimientoError] = useState('');
  const [municipioError, setMunicipioError] = useState('');
  const [zonaResidencialError, setZonaResidencialError] = useState('');
  const [tipoViviendaError, setTipoViviendaError] = useState('');
  const [direccionError, setDireccionError] = useState('');
  const [direccionFotosError, setDireccionFotosError] = useState('');
  const [phoneValidationActive, setPhoneValidationActive] = useState(false);

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
  const [refsParentescosState, setRefsParentescosState] = useState<string[]>(['']);

  

  // existing foto filenames (from backend) and removed lists
  const [existingFotosDocs, setExistingFotosDocs] = useState<string[]>([]);
  const [existingFotosNegocio, setExistingFotosNegocio] = useState<string[]>([]);
  const [existingFotosDireccion, setExistingFotosDireccion] = useState<string[]>([]);
  const [existingFotosDireccionConyuge, setExistingFotosDireccionConyuge] = useState<string[]>([]);

  // Teléfono del cónyuge con mismo formato que teléfonos personales
  const [conyugePhoneEntry, setConyugePhoneEntry] = useState<PhoneEntry>({
    code: '+504',
    number: '',
  });

  // Prefill the form when client data loads
  useEffect(() => {
    if (!clienteData) return;

    const normalizeDateOnly = (value: unknown) => {
      if (!value) return '';
      const str = String(value);
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      if (str.includes('T')) return str.split('T')[0];
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      return '';
    };

    const fechaNacimientoOnly = normalizeDateOnly(clienteData.fechaNacimiento);

    // Fill scalar fields
    const riesgoMoraFromBackend = clienteData.riesgoMora;
    const estadoDeudaFromBackend: EstadoDeuda | undefined = estadosDeuda.includes(
      riesgoMoraFromBackend as EstadoDeuda,
    )
      ? (riesgoMoraFromBackend as EstadoDeuda)
      : undefined;

    setForm((prev) => ({
      ...prev,
      codigoCliente: clienteData.codigoCliente || prev.codigoCliente,
      identidadCliente: clienteData.identidadCliente || prev.identidadCliente,
      nacionalidad: clienteData.nacionalidad || prev.nacionalidad,
      RTN: clienteData.RTN || prev.RTN,

      estadoCivil: clienteData.estadoCivil || prev.estadoCivil,
      nivelEducativo: clienteData.nivelEducativo || prev.nivelEducativo,

      nombre: clienteData.nombre || prev.nombre,
      apellido: clienteData.apellido || prev.apellido,
      email: clienteData.email ?? '',
      sexo: clienteData.sexo || prev.sexo,
      fechaNacimiento: fechaNacimientoOnly || prev.fechaNacimiento,

      departamentoResidencia: clienteData.departamentoResidencia || prev.departamentoResidencia,
      municipioResidencia: clienteData.municipioResidencia || prev.municipioResidencia,
      zonaResidencialCliente: clienteData.zonaResidencialCliente || prev.zonaResidencialCliente,
      direccion: clienteData.direccion || prev.direccion,
      tipoVivienda: clienteData.tipoVivienda || prev.tipoVivienda,
      antiguedadVivenda: String(clienteData.antiguedadVivenda ?? prev.antiguedadVivenda),

      telefono: Array.isArray(clienteData.telefono) ? clienteData.telefono : prev.telefono,

      conyugeNombre: clienteData.conyugeNombre || prev.conyugeNombre,
      conyugeTelefono: clienteData.conyugeTelefono || prev.conyugeTelefono,

      limiteCredito: String(clienteData.limiteCredito ?? prev.limiteCredito),
      estadoDeuda: estadoDeudaFromBackend || prev.estadoDeuda,
      referencias: Array.isArray(clienteData.referencias) ? clienteData.referencias : prev.referencias,
      actividad: clienteData.actividad ?? clienteData.actividad ?? prev.actividad,

      negocioNombre: clienteData.negocioNombre || prev.negocioNombre,
      negocioTipo: clienteData.negocioTipo || prev.negocioTipo,
      negocioDireccion: clienteData.negocioDireccion || prev.negocioDireccion,
      negocioTelefono: clienteData.negocioTelefono || prev.negocioTelefono,
      negocioDepartamento: clienteData.negocioDepartamento || prev.negocioDepartamento,
      negocioMunicipio: clienteData.negocioMunicipio || prev.negocioMunicipio,
      negocioZonaResidencial: clienteData.negocioZonaResidencial || prev.negocioZonaResidencial,
      negocioParentesco: clienteData.parentescoPropietario ?? prev.negocioParentesco,
      ventaDiaria: String(clienteData.ventaDiaria ?? prev.ventaDiaria ?? '0'),
      capacidadPago: String(clienteData.capacidadPago ?? prev.capacidadPago ?? '0'),
    }));

    // Phones
    const phones = clienteData.telefono || [];
    if (phones.length > 0) {
      const parsed = phones.map((p) => {
        const m = p.match(/^(\+\d{1,4})\s*(.*)$/);
        return { code: m?.[1] || '+504', number: (m?.[2] || '').replace(/[^\d]/g, '').slice(0, 8) };
      });
      setPhoneEntries(parsed.slice(0, 3));
    }

    // spouse
    if (clienteData.conyugeTelefono) {
      const m = clienteData.conyugeTelefono.match(/^(\+\d{1,4})\s*(.*)$/);
      setConyugePhoneEntry({ code: m?.[1] || '+504', number: (m?.[2] || '').replace(/[^\d]/g, '').slice(0, 8) });
    }

    // negocio phone
    if (clienteData.negocioTelefono) {
      const m = clienteData.negocioTelefono.match(/^(\+\d{1,4})\s*(.*)$/);
      setNegocioPhoneEntry({ code: m?.[1] || '+504', number: (m?.[2] || '').replace(/[^\d]/g, '').slice(0, 8) });
    }
    // negocio pariente phone
    if (clienteData.negocioParentescoTelefono) {
      const m = clienteData.negocioParentescoTelefono.match(/^(\+\d{1,4})\s*(.*)$/);
      const code = m?.[1] || '+504';
      const num = (m?.[2] || '').replace(/[^\d]/g, '').slice(0, 8);
      setForm((prev) => ({ ...prev, negocioParentescoTelefono: `${code} ${num}` }));
    }

    // referencias -> names & phones
    const refs = clienteData.referencias || [];
    if (refs.length > 0) {
      const parentescos: string[] = [];
      const phonesR: PhoneEntry[] = [];
      refs.forEach((r) => {
        const parts = r.split(' - ').map((s) => s.trim());
        if (parts.length === 2) {
          // extraer parentesco si el nombre contiene "(Parentesco)"
          const mName = parts[0].match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (mName) {
            parentescos.push(mName[2].trim());
          } else {
            // si viene "Parentesco" sin nombre, lo tratamos como parentesco
            parentescos.push(parts[0]);
          }
          const m = parts[1].match(/^(\+\d{1,4})\s*(.*)$/);
          phonesR.push({ code: m?.[1] || '+504', number: (m?.[2] || '').replace(/[^\d]/g, '').slice(0, 8) });
        } else {
          parentescos.push('');
          const m = r.match(/^(\+\d{1,4})\s*(.*)$/);
          phonesR.push({ code: m?.[1] || '+504', number: (m?.[2] || '').replace(/[^\d]/g, '').slice(0, 8) });
        }
      });
      setRefsParentescosState(parentescos.length ? parentescos : ['']);
      setRefsPhoneEntries(phonesR.length ? phonesR : [{ code: '+504', number: '' }]);
      setForm((prev) => ({ ...prev, refsParentescoTelefonos: [] }));
    }

    // existing fotos
    setExistingFotosDocs(Array.isArray(clienteData.documentosFotos) ? clienteData.documentosFotos : []);
    setExistingFotosNegocio(Array.isArray(clienteData.negocioFotos) ? clienteData.negocioFotos : []);
    setExistingFotosDireccion(Array.isArray(clienteData.fotosDireccion) ? clienteData.fotosDireccion : []);
    setExistingFotosDireccionConyuge(
      Array.isArray(clienteData.fotosDireccionConyuge)
        ? clienteData.fotosDireccionConyuge
        : [],
    );
  }, [clienteData]);

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
      const parentesco = (refsParentescosState[idx] || '').trim();
      const label = parentesco;
      return label ? `${label} - ${phone}` : phone;
    });
    setForm((prev) => ({
      ...prev,
      referencias: refs,
      refsParentescos: [...refsParentescosState],
      refsParentescoTelefonos: [],
    }));
  }, [refsPhoneEntries, refsParentescosState]);

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

  const validateFechaNacimiento = (value: string) => {
    if (!value) {
      setFechaNacimientoError('La fecha de nacimiento es requerida');
      return false;
    }

    if (!isAdult18(value)) {
      setFechaNacimientoError('El cliente debe ser mayor de 18 años');
      return false;
    }

    setFechaNacimientoError('');
    return true;
  };

  const validateDireccionStep = () => {
    let ok = true;

    if (!form.municipioResidencia.trim()) {
      setMunicipioError('El municipio es requerido');
      ok = false;
    } else {
      setMunicipioError('');
    }

    if (!form.zonaResidencialCliente.trim()) {
      setZonaResidencialError('La zona residencial es requerida');
      ok = false;
    } else {
      setZonaResidencialError('');
    }

    if (!form.tipoVivienda.trim()) {
      setTipoViviendaError('El tipo de vivienda es requerido');
      ok = false;
    } else {
      setTipoViviendaError('');
    }

    if (!form.direccion.trim()) {
      setDireccionError('La dirección es requerida');
      ok = false;
    } else {
      setDireccionError('');
    }

    const totalDireccionFotos =
      (existingFotosDireccion?.length ?? 0) + (form.direccionFotos?.length ?? 0);

    if (totalDireccionFotos === 0) {
      setDireccionFotosError('Debe adjuntar al menos una foto de la dirección');
      ok = false;
    } else {
      setDireccionFotosError('');
    }

    return ok;
  };

  const validatePhones = () => {
    setPhoneValidationActive(true);
    return (
      phoneEntries.length > 0 &&
      phoneEntries.every((p) => p.number.replace(/[^\d]/g, '').length === 8)
    );
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
      prev.length >= 3 ? prev : [...prev, { code: '+504', number: '' }],
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
      if (!(form.email ? validateEmail(form.email) : true)) isValid = false;
      if (!validateIdentidad(form.identidadCliente)) isValid = false;
      if (!form.nacionalidad.trim()) {
        alert('La nacionalidad es requerida');
        isValid = false;
      }
      if (!validateFechaNacimiento(form.fechaNacimiento)) isValid = false;
      // Teléfono personal obligatorio: cada teléfono agregado debe ser válido (8 dígitos)
      if (!validatePhones()) isValid = false;
    } else if (activeStep === 1) {
      if (!validateDireccionStep()) isValid = false;
      if (Number(form.antiguedadVivenda) <= 0) {
        alert('La antigüedad de vivienda debe ser mayor a 0 años');
        isValid = false;
      }
      if (!form.departamentoResidencia.trim()) {
        alert('El departamento de residencia es requerido');
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
    }

    if (isValid) {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    const fail = (msg: string) => {
      setSnackbarSeverity('error');
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    };

    // Validaciones finales básicas
    if (
      !validateNombre(form.nombre) ||
      !validateApellido(form.apellido) ||
      !(form.email ? validateEmail(form.email) : true) ||
      !validateIdentidad(form.identidadCliente)
    ) {
      fail('Por favor corrija los errores en los campos');
      return;
    }

    if (!validateFechaNacimiento(form.fechaNacimiento)) {
      setActiveStep(0);
      return;
    }

    if (!validatePhones()) {
      setActiveStep(0);
      return;
    }

    // Dirección: validar en el frontend (inline) para evitar error backend/localhost
    if (!validateDireccionStep()) {
      setActiveStep(1);
      return;
    }

    if (Number(form.antiguedadVivenda) <= 0) {
      fail('La antigüedad de vivienda debe ser mayor a 0 años');
      return;
    }

    // `direccionFotos` se valida en validateDireccionStep()

    if (
      form.RTN &&
      (!/^\d+$/.test(form.RTN) || String(form.RTN).length > 14)
    ) {
      fail('RTN debe ser numérico y no exceder 14 dígitos');
      return;
    }

    if (Number(form.limiteCredito) < 0) {
      fail('Los valores financieros deben ser mayores o iguales a 0');
      return;
    }

    // Teléfonos personales ya validados en validatePhones()

    // Cónyuge opcional: si existe, debe ser válido
    const spouseDigits = conyugePhoneEntry.number.replace(/[^\d]/g, '');
    if (spouseDigits.length > 0 && spouseDigits.length !== 8) {
      fail('El teléfono del cónyuge debe tener exactamente 8 dígitos');
      return;
    }

    setSaving(true);

    try {
      const [direccionUploads, conyugeDirUploads, docsUploads, negocioUploads] =
        await Promise.all([
          uploadImageFiles(form.direccionFotos || []),
          uploadImageFiles(form.conyugeDireccionFotos || []),
          uploadImageFiles(form.documentosFotos || []),
          uploadImageFiles(form.negocioFotos || []),
        ]);

      const fotosDocs = [
        ...existingFotosDocs,
        ...docsUploads.map((u) => u.url),
      ];
      const fotosNegocio = [
        ...existingFotosNegocio,
        ...negocioUploads.map((u) => u.url),
      ];
      const fotosDireccion = [
        ...existingFotosDireccion,
        ...direccionUploads.map((u) => u.url),
      ];
      const fotosDireccionConyuge = [
        ...existingFotosDireccionConyuge,
        ...conyugeDirUploads.map((u) => u.url),
      ];

      /**
       * 🔥 PAYLOAD ALINEADO AL BACKEND (MONGOOSE)
       */
      const payload = {
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
        fotosDireccion,

        // Contacto
        telefono: form.telefono,

        // Cónyuge
        conyugeNombre: form.conyugeNombre || undefined,
        conyugeTelefono: form.conyugeTelefono || undefined,

        // Financieros
        limiteCredito: Number(form.limiteCredito),
        ventaDiaria: Number(form.ventaDiaria || 0),
        capacidadPago: Number(form.capacidadPago || 0),

        // 🔑 Backend field (antes estadoDeuda en el UI)
        riesgoMora: form.estadoDeuda,

        // Referencias
        referencias: form.referencias.filter((r) => r.trim() !== ''),
        refsParentescoTelefonos: (form.refsParentescoTelefonos || []).filter(
          (t) => t && t.replace(/\s/g, '').length > 0,
        ),

        // 🔑 Backend field (antes actividad en el UI)
        activo: form.actividad,

        // Negocio (NO usamos dirección)
        negocioNombre: form.negocioNombre || undefined,
        negocioTipo: form.negocioTipo || undefined,
        negocioTelefono: form.negocioTelefono || undefined,
        negocioDepartamento: form.negocioDepartamento || undefined,
        negocioMunicipio: form.negocioMunicipio || undefined,
        negocioZonaResidencial: form.negocioZonaResidencial || undefined,
        parentescoPropietario: form.negocioParentesco || undefined,

        // Fotos (ahora enviamos URLs; preservando existentes)
        fotosDocs,
        fotosNegocio,
        fotosDireccionConyuge: fotosDireccionConyuge,
      };

      const targetId = codigoClienteParam || form.codigoCliente;
      await apiFetch(`/clientes/${encodeURIComponent(String(targetId))}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSnackbarSeverity('success');
      setSnackbarMsg('Cliente actualizado correctamente.');
      setSnackbarOpen(true);
      

      router.push('/clientes');
    } catch (err) {
      console.error(err);
      setSnackbarSeverity('error');
      setSnackbarMsg('Error al actualizar el cliente.');
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

  const addReferencia = () => {
    setRefsPhoneEntries((prev) => [...prev, { code: '+504', number: '' }]);
    setRefsParentescosState((prev) => [...prev, '']);
  };

  const removeReferencia = (index: number) => {
    setRefsPhoneEntries((prev) => prev.filter((_, i) => i !== index));
    setRefsParentescosState((prev) => prev.filter((_, i) => i !== index));
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
            <Typography variant="h6">Editar cliente</Typography>
            <Typography variant="caption" color="text.secondary">
              Edita toda la información personal, residencial y financiera.
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
                  onChange={(e) => {
                    handleChange('fechaNacimiento', e.target.value);
                    if (fechaNacimientoError) setFechaNacimientoError('');
                  }}
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  error={!!fechaNacimientoError}
                  helperText={fechaNacimientoError}
                />

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 1 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Teléfonos (máximo 3) *
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
                        label={`Teléfono ${idx + 1}`}
                        value={entry.number}
                        onChange={(e) =>
                          handlePhoneEntryChange(idx, 'number', e.target.value)
                        }
                        placeholder="XXXX-XXXX"
                        size="small"
                        sx={{ flex: 1 }}
                        required
                        error={
                          phoneValidationActive &&
                          entry.number.replace(/[^\d]/g, '').length !== 8
                        }
                        helperText={
                          phoneValidationActive &&
                          entry.number.replace(/[^\d]/g, '').length !== 8
                            ? 'El teléfono es requerido (8 dígitos)'
                            : 'Ingrese solo números'
                        }
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
                <FormControl margin="normal" required>
                  <InputLabel id="departamento-residencia-label">Departamento</InputLabel>
                  <Select
                    labelId="departamento-residencia-label"
                    value={form.departamentoResidencia}
                    label="Departamento"
                    onChange={(e) =>
                      handleChange('departamentoResidencia', e.target.value as string)
                    }
                  >
                    {departamentosHonduras.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        {dep}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Municipio"
                  value={form.municipioResidencia}
                  onChange={(e) => {
                    handleChange('municipioResidencia', e.target.value);
                    if (municipioError) setMunicipioError('');
                  }}
                  required
                  margin="normal"
                  error={!!municipioError}
                  helperText={municipioError}
                />

                <TextField
                  label="Zona residencial"
                  value={form.zonaResidencialCliente}
                  onChange={(e) => {
                    handleChange('zonaResidencialCliente', e.target.value);
                    if (zonaResidencialError) setZonaResidencialError('');
                  }}
                  required
                  margin="normal"
                  error={!!zonaResidencialError}
                  helperText={zonaResidencialError}
                />

                <TextField
                  label="Tipo de vivienda"
                  value={form.tipoVivienda}
                  onChange={(e) => {
                    handleChange('tipoVivienda', e.target.value);
                    if (tipoViviendaError) setTipoViviendaError('');
                  }}
                  required
                  margin="normal"
                  error={!!tipoViviendaError}
                  helperText={tipoViviendaError}
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
                  onChange={(e) => {
                    handleChange('direccion', e.target.value);
                    if (direccionError) setDireccionError('');
                  }}
                  required
                  margin="normal"
                  fullWidth
                  sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
                  error={!!direccionError}
                  helperText={direccionError}
                />
                {/* Foto(s) de dirección */}
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 1 }}>
                  <Typography variant="subtitle2">Foto(s) de dirección *</Typography>
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
                        if (files.length > 0 && direccionFotosError) setDireccionFotosError('');
                      }}
                    />
                  </Button>
                  {direccionFotosError ? (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                      {direccionFotosError}
                    </Typography>
                  ) : null}

                  {existingFotosDireccion.length > 0 && (
                    <>
                      <List dense>
                        {existingFotosDireccion.map((f, idx) => {
                          const isUrl = isHttpUrl(String(f));
                          const label = isUrl ? String(f).split('/').pop() || String(f) : String(f);
                          return (
                            <ListItem
                              key={`existing-dir-${idx}`}
                              sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                              secondaryAction={
                                isUrl ? (
                                  <Button size="small" component="a" href={String(f)} target="_blank" rel="noreferrer">
                                    Ver
                                  </Button>
                                ) : null
                              }
                            >
                              <ListItemText primary={label} />
                            </ListItem>
                          );
                        })}
                      </List>
                      <UrlPreviewGrid items={existingFotosDireccion} altPrefix="dir-existing" />
                    </>
                  )}

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
                                setForm((prev) => {
                                  const nextFotos = (prev.direccionFotos || []).filter((_, i) => i !== idx);
                                  if (nextFotos.length === 0) {
                                    setDireccionFotosError('Debe adjuntar al menos una foto de la dirección');
                                  }
                                  return {
                                    ...prev,
                                    direccionFotos: nextFotos,
                                  };
                                })
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
                  <FilePreviewGrid files={form.direccionFotos || []} altPrefix="dir-new" />
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

                        {existingFotosDireccionConyuge.length > 0 && (
                          <>
                            <List dense>
                              {existingFotosDireccionConyuge.map((f, idx) => {
                                const isUrl = isHttpUrl(String(f));
                                const label = isUrl ? String(f).split('/').pop() || String(f) : String(f);
                                return (
                                  <ListItem
                                    key={`existing-dirc-${idx}`}
                                    sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                                    secondaryAction={
                                      isUrl ? (
                                        <Button size="small" component="a" href={String(f)} target="_blank" rel="noreferrer">
                                          Ver
                                        </Button>
                                      ) : null
                                    }
                                  >
                                    <ListItemText primary={label} />
                                  </ListItem>
                                );
                              })}
                            </List>
                            <UrlPreviewGrid items={existingFotosDireccionConyuge} altPrefix="dirc-existing" />
                          </>
                        )}

                        <FilePreviewGrid files={form.conyugeDireccionFotos || []} altPrefix="dirc-new" />
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

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, mt: 2 }}>
                  <Typography variant="subtitle2">Riesgo de Mora</Typography>
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
                  {existingFotosDocs.length > 0 && (
                    <>
                      <List dense>
                        {existingFotosDocs.map((f, idx) => {
                          const isUrl = isHttpUrl(String(f));
                          const label = isUrl ? String(f).split('/').pop() || String(f) : String(f);
                          return (
                            <ListItem
                              key={`existing-doc-${idx}`}
                              sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                              secondaryAction={
                                isUrl ? (
                                  <Button size="small" component="a" href={String(f)} target="_blank" rel="noreferrer">
                                    Ver
                                  </Button>
                                ) : null
                              }
                            >
                              <ListItemText primary={label} />
                            </ListItem>
                          );
                        })}
                      </List>
                      <UrlPreviewGrid items={existingFotosDocs} altPrefix="doc-existing" />
                    </>
                  )}
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
                  <FilePreviewGrid files={form.documentosFotos || []} altPrefix="doc-new" />
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
                      <FormControl fullWidth size="small" margin="normal">
                        <InputLabel id="negocio-departamento-label">Departamento</InputLabel>
                        <Select
                          labelId="negocio-departamento-label"
                          value={form.negocioDepartamento || ''}
                          label="Departamento"
                          onChange={(e) => handleChange('negocioDepartamento', e.target.value as string)}
                        >
                          {departamentosHonduras.map((dep) => (
                            <MenuItem key={dep} value={dep}>
                              {dep}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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

                  {existingFotosNegocio.length > 0 && (
                    <>
                      <List dense>
                        {existingFotosNegocio.map((f, idx) => {
                          const isUrl = isHttpUrl(String(f));
                          const label = isUrl ? String(f).split('/').pop() || String(f) : String(f);
                          return (
                            <ListItem
                              key={`existing-neg-${idx}`}
                              sx={{ py: 0, display: 'flex', alignItems: 'center' }}
                              secondaryAction={
                                isUrl ? (
                                  <Button size="small" component="a" href={String(f)} target="_blank" rel="noreferrer">
                                    Ver
                                  </Button>
                                ) : null
                              }
                            >
                              <ListItemText primary={label} />
                            </ListItem>
                          );
                        })}
                      </List>
                      <UrlPreviewGrid items={existingFotosNegocio} altPrefix="neg-existing" />
                    </>
                  )}

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
                  <FilePreviewGrid files={form.negocioFotos || []} altPrefix="neg-new" />
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

export default EditarClientePage;
