import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from '@mui/material';
import type { PredictionsParams } from '@/lib/auth/client';
import { authClient } from '@/lib/auth/client';

interface PredictionDetailsModalProps {
  open: boolean;
  predictionId: number;
  onClose: () => void;
}

function PredictionDetailsModal({ open, predictionId, onClose }: PredictionDetailsModalProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [predictionDetails, setPredictionDetails] = useState<PredictionsParams | null>(null);
  const [errorPreDet, setErrorPreDet] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictionDetails = async (): Promise<void> => {
      setLoading(true);
      setErrorPreDet(null);

      const { data, error } = await authClient.getPredictionById(predictionId);

      if (error) {
        setErrorPreDet(error);
      } else {
        setPredictionDetails(data || null);
      }

      setLoading(false);
    };

    if (predictionId) {
      fetchPredictionDetails();
    }
  }, [predictionId]);

  const imageUrl = predictionDetails?.image instanceof File
    ? URL.createObjectURL(predictionDetails.image)
    : predictionDetails?.image;

    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) {
        return "Fecha no disponible";
      }
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "Fecha inválida"
        : date.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
    };
    
    const formatTime = (dateString: string | null | undefined): string => {
      if (!dateString) {
        return "Hora no disponible";
      }
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? "Hora inválida"
        : date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    };

    const translateResult = (result: string): string => {
      const translations: Record<string, string> = {
        "Fresh": "Fresca",
        "Half-fresh": "Semi Fresca",
        "Spoiled": "Estropeada",
      };
      
      return translations[result] || result; // Devuelve el valor original si no hay traducción
    };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
  <DialogTitle>Detalles de Predicción</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    {loading ? (
      <CircularProgress />
    ) : errorPreDet ? (
      <Typography color="error">{errorPreDet}</Typography>
    ) : predictionDetails ? (
      <div style={{ textAlign: 'center' }}>
        <img src={imageUrl} alt="Prediction" width="60%" />
        <Typography variant="h6">Resultado: {translateResult(predictionDetails.result)}</Typography>
        <Typography>Fecha: {formatDate(predictionDetails.createdAt)}</Typography>
        <Typography>Hora: {formatTime(predictionDetails.updatedAt)}</Typography>
      </div>
    ) : (
      <Typography>No se encontraron detalles para esta predicción.</Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cerrar</Button>
  </DialogActions>
</Dialog>

  );
};

export default PredictionDetailsModal;
