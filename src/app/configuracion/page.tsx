'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  ButtonBase,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type CobroEnMora = 'corriente' | 'corriente_y_mora' | 'solo_mora';
type PeriodicidadTasa = 'anual' | 'mensual';
type TipoCuota = 'flat' | 'nivelada';

type ParametrosForm = {
  periodicidadTasa: PeriodicidadTasa;
  tasaMora: string;
  cobroEnMora: CobroEnMora;
  montoMin: string;
  montoMax: string;
  decimales: string;
  diasGracia: string;
  tipoCuota: TipoCuota;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const toIsoDate = (d: Date) => {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${year}-${month}-${day}`;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const addMonths = (d: Date, delta: number) =>
  new Date(d.getFullYear(), d.getMonth() + delta, 1);

const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

// Monday=0 ... Sunday=6
const mondayIndex = (jsDay: number) => (jsDay + 6) % 7;

const addDays = (d: Date, delta: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
};

// Gregorian computus (Anonymous algorithm)
const easterSunday = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const hondurasHolidays = (year: number): string[] => {
  // Basado en feriados nacionales típicos en Honduras. Algunos feriados pueden
  // moverse por decreto; aquí se incluyen los más comunes de fecha fija y Semana Santa.
  const fixed: Array<{ m: number; d: number }> = [
    { m: 1, d: 1 }, // Año Nuevo
    { m: 2, d: 3 }, // Virgen de Suyapa
    { m: 4, d: 14 }, // Día de las Américas
    { m: 5, d: 1 }, // Día del Trabajo
    { m: 9, d: 15 }, // Independencia
    { m: 10, d: 3 }, // Francisco Morazán
    { m: 10, d: 12 }, // Día de la Raza
    { m: 10, d: 21 }, // Fuerzas Armadas
    { m: 12, d: 25 }, // Navidad
  ];

  const easter = easterSunday(year);
  const holyThursday = addDays(easter, -3);
  const goodFriday = addDays(easter, -2);

  return [
    ...fixed.map(({ m, d }) => toIsoDate(new Date(year, m - 1, d))),
    toIsoDate(holyThursday),
    toIsoDate(goodFriday),
  ];
};

export default function ConfiguracionPage() {
  const [form, setForm] = useState<ParametrosForm>({
    periodicidadTasa: 'anual',
    tasaMora: '',
    cobroEnMora: 'corriente',
    montoMin: '',
    montoMax: '',
    decimales: '2',
    diasGracia: '0',
    tipoCuota: 'nivelada',
  });

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));

  const [userHolidays, setUserHolidays] = useState<string[]>([]);

  const hnHolidaySet = useMemo(() => {
    const year = calendarMonth.getFullYear();
    return new Set(hondurasHolidays(year));
  }, [calendarMonth]);

  const userHolidaySet = useMemo(() => new Set(userHolidays), [userHolidays]);

  const selectedHolidaySet = useMemo(() => {
    const union = new Set<string>(hnHolidaySet);
    for (const d of userHolidaySet) union.add(d);
    return union;
  }, [hnHolidaySet, userHolidaySet]);

  const handleChange = <K extends keyof ParametrosForm>(
    key: K,
    value: ParametrosForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleHoliday = (date: string) => {
    // Los feriados oficiales de Honduras quedan siempre marcados.
    if (hnHolidaySet.has(date)) return;

    setUserHolidays((prev) => {
      if (prev.includes(date)) return prev.filter((d) => d !== date);
      return [...prev, date].sort();
    });
  };

  const onApplyChanges = () => {
    const ok = window.confirm('¿Desea aplicar estos cambios?');
    if (!ok) return;

    const holidaysForYear = Array.from(selectedHolidaySet)
      .filter((d) => d.startsWith(`${calendarMonth.getFullYear()}-`))
      .sort();

    const payload = {
      ...form,
      feriados: holidaysForYear,
    };

    // TODO: conectar con tu endpoint usando apiFetch cuando esté disponible.
    console.log('Aplicar Cambios -> payload:', payload);
  };

  const montoMinNum = form.montoMin ? Number(form.montoMin) : null;
  const montoMaxNum = form.montoMax ? Number(form.montoMax) : null;
  const montoRangoInvalido =
    montoMinNum !== null &&
    montoMaxNum !== null &&
    Number.isFinite(montoMinNum) &&
    Number.isFinite(montoMaxNum) &&
    montoMinNum > montoMaxNum;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">Parámetros del sistema</Typography>
        <Typography variant="caption" color="text.secondary">
          Configura los valores que el sistema utilizará para cálculos y cobros.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="periodicidad-tasa-label">Periodicidad de tasa</InputLabel>
              <Select
                labelId="periodicidad-tasa-label"
                label="Periodicidad de tasa"
                value={form.periodicidadTasa}
                onChange={(e) =>
                  handleChange('periodicidadTasa', e.target.value as PeriodicidadTasa)
                }
              >
                <MenuItem value="anual">Anual</MenuItem>
                <MenuItem value="mensual">Mensual</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Tasa mora"
              type="number"
              value={form.tasaMora}
              onChange={(e) => handleChange('tasaMora', e.target.value)}
              inputProps={{ step: 1, min: 0 }}
              helperText="Porcentaje (%)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="cobro-en-mora-label">Cobro en mora</InputLabel>
              <Select
                labelId="cobro-en-mora-label"
                label="Cobro en mora"
                value={form.cobroEnMora}
                onChange={(e) =>
                  handleChange('cobroEnMora', e.target.value as CobroEnMora)
                }
              >
                <MenuItem value="corriente">Corriente</MenuItem>
                <MenuItem value="corriente_y_mora">Corriente y mora</MenuItem>
                <MenuItem value="solo_mora">Solo mora</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Monto mín."
              type="number"
              value={form.montoMin}
              onChange={(e) => handleChange('montoMin', e.target.value)}
              inputProps={{ step: 100, min: 0 }}
              error={montoRangoInvalido}
              helperText={montoRangoInvalido ? 'El monto mín. no puede ser mayor al máx.' : ' '}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Monto máx."
              type="number"
              value={form.montoMax}
              onChange={(e) => handleChange('montoMax', e.target.value)}
              inputProps={{ step: 100, min: 0 }}
              error={montoRangoInvalido}
              helperText=" "
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Decimales"
              type="number"
              value={form.decimales}
              onChange={(e) => handleChange('decimales', e.target.value)}
              inputProps={{ step: 1, min: 0, max: 6 }}
              helperText="Cantidad de decimales a mostrar"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Días de gracia"
              type="number"
              value={form.diasGracia}
              onChange={(e) => handleChange('diasGracia', e.target.value)}
              inputProps={{ step: 1, min: 0 }}
              helperText="Días sin recargo al vencer"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="tipo-cuota-label">Tipo de cuota</InputLabel>
              <Select
                labelId="tipo-cuota-label"
                label="Tipo de cuota"
                value={form.tipoCuota}
                onChange={(e) => handleChange('tipoCuota', e.target.value as TipoCuota)}
              >
                <MenuItem value="flat">Cuota flat</MenuItem>
                <MenuItem value="nivelada">Cuota nivelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Días feriados</Typography>
        <Typography variant="caption" color="text.secondary">
          En los días feriados no se cobra. Selecciona múltiples días haciendo clic sobre el calendario.
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              width: { xs: '100%', sm: 460 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Button size="small" onClick={() => setCalendarMonth((m) => addMonths(m, -1))}>
                Anterior
              </Button>
              <Typography variant="subtitle2" sx={{ textAlign: 'center' }}>
                {calendarMonth.toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </Typography>
              <Button size="small" onClick={() => setCalendarMonth((m) => addMonths(m, 1))}>
                Siguiente
              </Button>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mt: 2 }}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <Typography
                  key={d}
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', fontWeight: 600 }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            {(() => {
              const first = startOfMonth(calendarMonth);
              const offset = mondayIndex(first.getDay());
              const totalDays = daysInMonth(calendarMonth);
              const cells: Array<null | { day: number; iso: string }> = [];

              for (let i = 0; i < offset; i += 1) cells.push(null);
              for (let day = 1; day <= totalDays; day += 1) {
                const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                cells.push({ day, iso: toIsoDate(d) });
              }
              while (cells.length % 7 !== 0) cells.push(null);

              return (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mt: 1 }}>
                  {cells.map((cell, idx) => {
                    if (!cell) {
                      return <Box key={`empty-${idx}`} sx={{ height: 46 }} />;
                    }

                    const selected = selectedHolidaySet.has(cell.iso);
                    const locked = hnHolidaySet.has(cell.iso);
                    return (
                      <ButtonBase
                        key={cell.iso}
                        onClick={() => toggleHoliday(cell.iso)}
                        sx={{
                          height: 46,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: selected ? 'primary.main' : 'divider',
                          bgcolor: selected ? 'rgba(56,189,248,0.18)' : 'transparent',
                          '&:hover': {
                            bgcolor: selected ? 'rgba(56,189,248,0.25)' : 'rgba(148,163,184,0.12)',
                          },
                          cursor: locked ? 'default' : 'pointer',
                          opacity: locked ? 0.95 : 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ width: '100%', textAlign: 'center' }}>
                          {cell.day}
                        </Typography>
                      </ButtonBase>
                    );
                  })}
                </Box>
              );
            })()}
          </Box>
        </Box>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="contained" onClick={onApplyChanges}>
            Aplicar Cambios
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
