'use client';

import * as React from 'react';
import { Button, Snackbar, Alert, Box, Card, Divider, Table, TableBody, TableCell, TableHead, TablePagination, TableRow } from '@mui/material';
import type { PredictionsParams } from '@/lib/auth/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelection } from '@/hooks/use-selection';
import PredictionDetailsModal from '@/components/dashboard/predictions/prediction-details-modal';

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

interface SuccessMessageProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

interface PredictionsTableProps {
  count?: number;
  page?: number;
  rows?: PredictionsParams[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SuccessMessage({ open, message, onClose }: SuccessMessageProps): React.JSX.Element {
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={onClose}>
      <Alert onClose={onClose} severity="success" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export function PredictionsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onPageChange = () => {/* No implementation needed */},
  onRowsPerPageChange = () => {/* No implementation needed */},
}: PredictionsTableProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const predictionIdFromUrl = searchParams.get('predictionId');
  const rowIds = React.useMemo(() => rows.map((predictions) => predictions.id), [rows]);
  const { selected } = useSelection(rowIds);
  
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedPrediction, setSelectedPrediction] = React.useState<number | null>(null);

  const handleCloseAlert = (): void => {
    setAlertOpen(false);
    setSuccessMessage(null);
  };

  // Detecta el parámetro predictionId en la URL y abre el modal si está presente
  React.useEffect(() => {
    if (predictionIdFromUrl) {
      setSelectedPrediction(parseInt(predictionIdFromUrl, 10));
      setModalOpen(true);
    }
  }, [predictionIdFromUrl]);

  const handleViewDetails = (id: number): void => {
  // Actualiza la URL sin recargar la página
  router.replace(`/dashboard/predictions?predictionId=${id}`);
  setSelectedPrediction(id);
  setModalOpen(true);
};

const handleCloseModal = (): void => {
  setModalOpen(false);
  setSelectedPrediction(null);
  // Vuelve a la URL anterior sin recargar la página
  router.replace('/dashboard/predictions');
};

  return (
    <>
      <Card>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: '800px' }}>
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Resultado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell style={{ width: '20%' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay predicciones disponibles
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow hover key={row.id} selected={selected?.has(row.id)}>
                    <TableCell>
                      <img src={row.image instanceof File ? URL.createObjectURL(row.image) : row.image} width={50} height={50} alt="" />
                    </TableCell>
                    <TableCell>{translateResult(row.result)}</TableCell>
                    <TableCell>{formatDate(new Date(row.createdAt).toString())}</TableCell>
                    <TableCell>{formatTime(new Date(row.updatedAt).toString())}</TableCell>
                    <TableCell>
                      <Button variant="contained" color="primary" onClick={() => {handleViewDetails(row.id)}}>
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Filas por página"
        />
      </Card>
      <SuccessMessage open={alertOpen} message={successMessage || ''} onClose={handleCloseAlert} />
      {selectedPrediction && (<PredictionDetailsModal open={modalOpen} predictionId={selectedPrediction} onClose={handleCloseModal} />)}
    </>
  );
}