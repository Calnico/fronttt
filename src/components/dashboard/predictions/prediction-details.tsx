'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Typography, CircularProgress, Alert, Stack, Snackbar, Button } from '@mui/material';
import type { PredictionsParams } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';
import { authClient } from '@/lib/auth/client';
import { API_URL } from '@/config';
import { useRouter } from 'next/router'
import { useSearchParams } from 'next/navigation';

export default function PredictionDetails(): React.JSX.Element {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const predictionId = searchParams.get('id');
  const [predictions, setPredictions] = useState<PredictionsParams[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionsParams | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [errors, setErrors] = useState<string | null>(null);

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // useEffect(() => {
  //   if (predictionId) {
  //   }
  // }, [predictionId]);

  useEffect(() => {
    const fetchPredictions = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_URL}/predictions`);
        if (!response.ok) {
          throw new Error('Error al obtener las predicciones');
        }

        const data: PredictionsParams[] = await response.json();
        setPredictions(data);
      } catch (error) {
        if (error instanceof Error) {
          setErrors(error.message);
          showSnackbar('Error al cargar las predicciones', 'error');
        } else {
          setErrors('Error desconocido');
          showSnackbar('Error desconocido', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [user]);

  const fetchPredictionDetails = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await authClient.getPredictionById(Number(id));
      if (error) {
        throw new Error(error);
      }
      setSelectedPrediction(data || null);
    } catch (errorPredic) {
      if (errorPredic instanceof Error) {
        setErrors(errorPredic.message);
        showSnackbar('Error al cargar la predicción', 'error');
      } else {
        setErrors('Error desconocido');
        showSnackbar('Error desconocido', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !predictionId) return;
  
    fetchPredictionDetails(predictionId);
  }, [router.isReady, predictionId, fetchPredictionDetails]);

  if (loading) {
    return <CircularProgress />;
  }

  if (errors) {
    return <Alert severity="error">{errors}</Alert>;
  }

  if (!selectedPrediction) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4">Lista de Predicciones</Typography>
        {predictions.length > 0 ? (
          predictions.map((prediction) => (
            <Button
              key={prediction.id}
              onClick={() => {
                if (prediction.id !== undefined) {
                  fetchPredictionDetails(prediction.id.toString());
                }
              }}
            >
              Ver Predicción {prediction.id}
            </Button>
          ))
        ) : (
          <Typography>No se encontraron predicciones.</Typography>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Detalle de Predicción</Typography>
      <Typography>Resultado: {selectedPrediction.result}</Typography>
      <Typography>
        Imagen:{' '}
        {selectedPrediction.image
          ? selectedPrediction.image instanceof File
            ? selectedPrediction.image.name
            : selectedPrediction.image
          : 'No hay imagen disponible'}
      </Typography>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}