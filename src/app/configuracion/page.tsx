'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ConfiguracionFinanciera,
  MetodoInteresCorriente,
  useConfiguracionFinanciera,
} from '../../hooks/useConfiguracionFinanciera';

type ParametrosForm = {
  montoPrestamoMin: string;
  montoPrestamoMax: string;
  metodoInteresCorriente: MetodoInteresCorriente;
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

const sundayDatesForMonth = (month: Date): string[] => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const totalDays = daysInMonth(month);
  const sundays: string[] = [];

  for (let day = 1; day <= totalDays; day += 1) {
    const d = new Date(year, monthIndex, day);
    if (d.getDay() === 0) sundays.push(toIsoDate(d));
  }

  return sundays;
};

const applyConfigToForm = (cfg: ConfiguracionFinanciera): ParametrosForm => ({
  montoPrestamoMin: String(cfg.montoPrestamoMin ?? ''),
  montoPrestamoMax: String(cfg.montoPrestamoMax ?? ''),
  metodoInteresCorriente: cfg.metodoInteresCorriente ?? 'SOBRE_SALDO',
});

export default function ConfiguracionPage() {
  const { data, loading, saving, error, save, reload } = useConfiguracionFinanciera();

  const [draftForm, setDraftForm] = useState<ParametrosForm | null>(null);

  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [draftHolidays, setDraftHolidays] = useState<string[] | null>(null);
  const sundaySet = useMemo(() => new Set(sundayDatesForMonth(calendarMonth)), [calendarMonth]);

  const form = useMemo<ParametrosForm>(() => {
    if (draftForm) return draftForm;
    if (data) return applyConfigToForm(data);
    return {
      montoPrestamoMin: '',
      montoPrestamoMax: '',
      metodoInteresCorriente: 'SOBRE_SALDO',
    };
  }, [draftForm, data]);

  const userHolidays = useMemo<string[]>(() => {
    if (draftHolidays) return draftHolidays;
    if (!data) return [];

    return (data.noLaborables ?? [])
      .map((x) => x.date)
      .filter((date): date is string => typeof date === 'string' && date.length >= 10)
      .map((date) => date.slice(0, 10))
      .sort();
  }, [draftHolidays, data]);

  const selectedHolidaySet = useMemo(() => {
    const union = new Set<string>(userHolidays);
    for (const d of sundaySet) union.add(d);
    return union;
  }, [userHolidays, sundaySet]);

  const handleChange = <K extends keyof ParametrosForm>(
    key: K,
    value: ParametrosForm[K]
  ) => {
    setDraftForm((prev) => ({ ...(prev ?? form), [key]: value }));
  };

  const toggleHoliday = (date: string) => {
    // Los domingos quedan siempre marcados por defecto.
    if (sundaySet.has(date)) return;

    setDraftHolidays((prev) => {
      const source = prev ?? userHolidays;
      if (source.includes(date)) return source.filter((d) => d !== date);
      return [...source, date].sort();
    });
  };

  const onApplyChanges = async () => {
    const ok = window.confirm('¿Desea aplicar estos cambios?');
    if (!ok) return;

    const montoPrestamoMin = Number(form.montoPrestamoMin);
    const montoPrestamoMax = Number(form.montoPrestamoMax);

    if (!Number.isFinite(montoPrestamoMin) || montoPrestamoMin < 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto mínimo válido.' });
      return;
    }

    if (!Number.isFinite(montoPrestamoMax) || montoPrestamoMax < 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto máximo válido.' });
      return;
    }

    if (montoPrestamoMin > montoPrestamoMax) {
      setFeedback({ type: 'error', message: 'El monto mínimo no puede ser mayor al máximo.' });
      return;
    }

    try {
      await save({
        montoPrestamoMin,
        montoPrestamoMax,
        metodoInteresCorriente: form.metodoInteresCorriente,
        weekendDays: [0],
        noLaborables: userHolidays.map((date) => ({ date, motivo: '' })),
      });
      setDraftForm(null);
      setDraftHolidays(null);
      setFeedback({ type: 'success', message: 'Configuración guardada correctamente.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron guardar los cambios.';
      setFeedback({ type: 'error', message });
    }
  };

  const montoMinNum = form.montoPrestamoMin ? Number(form.montoPrestamoMin) : null;
  const montoMaxNum = form.montoPrestamoMax ? Number(form.montoPrestamoMax) : null;
  const montoRangoInvalido =
    montoMinNum !== null &&
    montoMaxNum !== null &&
    Number.isFinite(montoMinNum) &&
    Number.isFinite(montoMaxNum) &&
    montoMinNum > montoMaxNum;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" onClick={reload} disabled={loading || saving}>
              Recargar
            </Button>
          </Stack>
        </Stack>

        {(loading || saving) && <LinearProgress sx={{ mt: 1.5 }} />}

        {feedback && (
          <Alert severity={feedback.type} sx={{ mt: 1.5 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Monto préstamo mín."
              type="number"
              value={form.montoPrestamoMin}
              onChange={(e) => handleChange('montoPrestamoMin', e.target.value)}
              inputProps={{ step: 100, min: 0 }}
              error={montoRangoInvalido}
              helperText={montoRangoInvalido ? 'El monto mín. no puede ser mayor al máx.' : ' '}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Monto préstamo máx."
              type="number"
              value={form.montoPrestamoMax}
              onChange={(e) => handleChange('montoPrestamoMax', e.target.value)}
              inputProps={{ step: 100, min: 0 }}
              error={montoRangoInvalido}
              helperText=" "
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Método interés corriente"
              value={form.metodoInteresCorriente}
              onChange={(e) => handleChange('metodoInteresCorriente', e.target.value as MetodoInteresCorriente)}
            >
              <MenuItem value="SOBRE_SALDO">Sobre saldo</MenuItem>
              <MenuItem value="FLAT">Flat</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

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
                    const locked = sundaySet.has(cell.iso);
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
          <Button variant="contained" onClick={onApplyChanges} disabled={loading || saving}>
            Aplicar Cambios
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
