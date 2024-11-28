'use client';

import * as React from 'react';
import { Snackbar, Alert, Select, MenuItem, InputLabel, FormControl, Button } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { User } from '@/types/user';
import { API_URL } from '@/config';
import { useEffect, useState } from 'react';

export function Notifications(): React.JSX.Element {
  const [isCronEnabled, setIsCronEnabled] = React.useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<string>('DAILY');
  const [initialFrequency, setInitialFrequency] = useState<string>('DAILY'); // Almacena la frecuencia inicial
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isFirstActivation, setIsFirstActivation] = useState(true); // Controla si se permite seleccionar EVERY_MINUTE

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleFrequencyChange = (event: SelectChangeEvent): void => {
    const newFrequency = event.target.value;
    setScheduleFrequency(newFrequency);
  };

  useEffect(() => {
    const fetchCronStatus = async (): Promise<void> => {
      const user: User = JSON.parse(localStorage.getItem('user') || '{}');
      const supermarketId = user?.supermarket?.id?.toString() || user?.ownedSupermarket?.id?.toString();

      try {
        const token = localStorage.getItem('custom-auth-token');
        const response = await fetch(`${API_URL}/supermarket/${supermarketId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: { cronjobEnabled: boolean; scheduleFrequency: string } = await response.json();
          setIsCronEnabled(Boolean(data.cronjobEnabled));
          setScheduleFrequency(data.scheduleFrequency);
          setInitialFrequency(data.scheduleFrequency); 
          // Deshabilitar EVERY_MINUTE si no es la frecuencia actual
          if (data.scheduleFrequency !== 'EVERY_MINUTE') {
            setIsFirstActivation(false);
          }
        } else {
          showSnackbar('Error al obtener el estado del cronjob', 'error');
        }
      } catch (error) {
        showSnackbar('Error al obtener el estado del cronjob', 'error');
      }
    };

    fetchCronStatus();
  }, []);

  const saveFrequencyChanges = async (): Promise<void> => {
    const user: User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = user?.supermarket?.id?.toString() || user?.ownedSupermarket?.id?.toString();

    if (!supermarketId) {
      showSnackbar('ID del supermercado no encontrado', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('custom-auth-token');
      const response = await fetch(`${API_URL}/supermarket/${supermarketId}/enable-cron`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduleFrequency }),
      });

      if (response.ok) {
        setInitialFrequency(scheduleFrequency); // Actualiza la frecuencia inicial después de guardar
        showSnackbar('Frecuencia actualizada correctamente', 'success');
      } else {
        showSnackbar('Error al actualizar la frecuencia', 'error');
      }
    } catch (error) {
      showSnackbar('Error al actualizar la frecuencia', 'error');
    }
  };

  const handleSwitchChange = async (): Promise<void> => {
    const user: User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = user?.supermarket?.id?.toString() || user?.ownedSupermarket?.id?.toString();

    if (!supermarketId) {
      showSnackbar('ID del supermercado no encontrado', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('custom-auth-token');

      if (isCronEnabled) {
        const response = await fetch(`${API_URL}/supermarket/${supermarketId}/disable-cron`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setIsCronEnabled(false);
          showSnackbar('Predicciones automáticas desactivadas', 'success');
        } else {
          showSnackbar('Error al desactivar predicciones automáticas', 'error');
        }
      } else {
        const response = await fetch(`${API_URL}/supermarket/${supermarketId}/enable-cron`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scheduleFrequency }), 
        });

        if (response.ok) {
          setIsCronEnabled(true);
          if (scheduleFrequency === 'EVERY_MINUTE') {
            setIsFirstActivation(false); // Deshabilitar EVERY_MINUTE en activaciones futuras
          }
          showSnackbar('Predicciones automáticas activadas', 'success');
        } else {
          showSnackbar('Error al activar predicciones automáticas', 'error');
        }
      }
    } catch (error) {
      showSnackbar('Error al cambiar el estado del cronjob', 'error');
    }
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); }}>
      <Card>
        <CardHeader subheader="Gestionar las notificaciones" title="Notificaciones" />
        <Divider />
        <CardContent>
          <Grid container spacing={6} wrap="wrap">
            <Grid md={4} sm={6} xs={12}>
              <Stack spacing={1}>
                <Typography variant="h6">Activar predicciones</Typography>
                <FormControlLabel
                  control={<Switch checked={isCronEnabled} onChange={handleSwitchChange} />}
                  label="Predicciones automáticas"
                />
                {isCronEnabled && (
                  <>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel id="frequency-label">Frecuencia</InputLabel>
                      <Select
                        labelId="frequency-label"
                        id="scheduleFrequency"
                        value={scheduleFrequency}
                        label="Frecuencia"
                        onChange={handleFrequencyChange}
                      >
                        <MenuItem value="EVERY_MINUTE" disabled={!isFirstActivation}>Cada minuto</MenuItem>
                        <MenuItem value="DAILY">Diario</MenuItem>
                        <MenuItem value="TWICE_DAILY">Dos veces al día</MenuItem>
                        <MenuItem value="WEEKLY">Semanal</MenuItem>
                        <MenuItem value="TWICE_WEEKLY">Dos veces a la semana</MenuItem>
                        <MenuItem value="MONTHLY">Mensual</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={saveFrequencyChanges}
                      disabled={scheduleFrequency === initialFrequency} // Deshabilitar si no hay cambios
                    >
                      Guardar cambios
                    </Button>
                  </>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
      </Card>
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </form>
  );
}
