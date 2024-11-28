'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Menu, MenuItem, Snackbar, Alert, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { API_URL } from '@/config';
import { PredictionsFilters } from '@/components/dashboard/predictions/predictions-filters';
import { PredictionsTable } from '@/components/dashboard/predictions/predictions-table';
import type { PredictionsParams } from '@/lib/auth/client';
import type  { User } from '@/types/user';


export default function Page(): React.JSX.Element {
  const [predictions, setPredictions] = useState<PredictionsParams[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };
  const translateModule = (result: string): string => {
    const translations: Record<string, string> = {
      "Fresh": 'Fresca',
      "Half-fresh": 'Semi Fresca',
      "Spoiled": 'Estropeada',
    };
  
    return translations[result] || result;
  };

  const filteredPredictions = predictions.filter((prediction) => {
    const translatedName = translateModule(prediction.result || '');
    return translatedName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const fetchPredictions = useCallback(async (): Promise<void> => {
    const userPredic: User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = userPredic?.supermarket?.id || userPredic?.ownedSupermarket?.id;
    if (!supermarketId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('custom-auth-token');
      const response = await fetch(`${API_URL}/predictions/supermarket/${supermarketId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar las predicciones');
      const predictionsData: PredictionsParams[] = await response.json() as PredictionsParams[];
      const sortedPredictions = predictionsData.sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });      
      setPredictions(sortedPredictions);
    } catch (error) {
      showSnackbar('Error al cargar las predicciones', 'error');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleExportExcel = (): void => {
    if (predictions.length === 0) {
      showSnackbar('No hay datos para exportar', 'error');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      predictions.map((prediction) => ({
        'Resultado': prediction.result || '',
        'Imagen': prediction.image || '',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Predicciones');
    XLSX.writeFile(workbook, 'predicciones.xlsx');
    handleCloseMenu();
    showSnackbar('Exportado a Excel con éxito', 'success');
  };

  const handleExportPDF = (): void => {
    // eslint-disable-next-line new-cap -- Utilizamos `new jsPDF()` como una excepción ya que el nombre viene de una biblioteca externa que no sigue esta convención.
    const doc = new jsPDF();
    doc.text('Lista de Predicciones', 10, 10);

    const columns = ['Categoría', 'Descripción'];
    const rows = predictions.map((prediction) => [prediction.result, prediction.image]);

    doc.autoTable({
      head: [columns],
      body: rows,
    });

    doc.save('predicciones.pdf');
    handleCloseMenu();
    showSnackbar('Exportado a PDF con éxito', 'success');
  };

  const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };

  const handleChangePage = (event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPredictions = applyPagination(filteredPredictions, predictions, page, rowsPerPage);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Predicciones</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              color="inherit"
              startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={handleClickMenu}
            >
              Exportar
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              <MenuItem onClick={handleExportPDF}>Exportar a PDF</MenuItem>
              <MenuItem onClick={handleExportExcel}>Exportar a Excel</MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Stack>
      <PredictionsFilters onSearch={setSearchTerm} />
      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <PredictionsTable
          count={predictions.length}
          page={page}
          rows={paginatedPredictions}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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

function applyPagination(rows: PredictionsParams[], _predictions: PredictionsParams[], page: number, rowsPerPage: number): PredictionsParams[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}