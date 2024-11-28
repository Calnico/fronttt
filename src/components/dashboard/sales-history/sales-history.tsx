'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, IconButton, DialogActions, Pagination, Snackbar, Alert } from '@mui/material';
import { API_URL } from '@/config';
import type { User } from '@/types/user';
import { DownloadSimple } from '@phosphor-icons/react';

interface Sale {
  id: number;
  userId: number;
  totalPrice: number;
  date: string; // Fecha de la venta
}

const ITEMS_PER_PAGE = 10; // Número máximo de ventas por página

// Función para formatear la fecha
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return "Fecha no disponible";
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Fecha inválida"
      : date.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
  };

export function SalesHistory(): React.JSX.Element {
  const [sales, setSales] = useState<Sale[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para el Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleSnackbarClose = (): void => {
    setSnackbarOpen(false);
  };

  const fetchSalesHistory = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('custom-auth-token');
      const user: User = JSON.parse(localStorage.getItem('user') || '{}');
      const supermarketId = user.ownedSupermarket?.id || user.supermarket?.id;

      if (!supermarketId) return;

      const response = await fetch(`${API_URL}/sales/${supermarketId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });

      if (response.ok) {
        const salesData: Sale[] = await response.json() as Sale[]; // Especifica el tipo `Sale[]`
        const sortedSales = salesData.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setSales(sortedSales);
        setSnackbarMessage('Historial de ventas cargado con éxito');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Error al cargar el historial de ventas');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      } catch (fetchError) { // Renombra `error` para evitar conflicto
        setSnackbarMessage('Error al cargar el historial de ventas');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
  };

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const paginatedSales = sales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number): void => {
    setCurrentPage(page);
  };

  const openInvoiceDialog = async (saleId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('custom-auth-token');
      const response = await fetch(`${API_URL}/sales/${saleId}/invoice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const newPdfUrl = URL.createObjectURL(blob); // Renombrado para evitar conflicto
        setPdfUrl(newPdfUrl);
        setDialogOpen(true);
        setSnackbarMessage('Factura cargada correctamente');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Error al cargar la factura');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      } catch (fetchError) { // Renombra `error` para evitar conflicto
        setSnackbarMessage('Error al cargar la factura');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
  };

  const closeDialog = (): void => {
    setDialogOpen(false);
    setPdfUrl(null);
  };

  return (
    <Card>
      <CardHeader title="Todas las ventas realizadas"/>
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID de Venta</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Ver Factura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell>${sale.totalPrice.toFixed()}</TableCell>
                  <TableCell>
                    <Button variant="outlined" color="primary" onClick={() => openInvoiceDialog(sale.id)}>
                      Ver Factura
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
        />
      </CardContent>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Ver Factura
          
          <IconButton
      component="a"
      href={pdfUrl || '#'}
      download="Factura_Venta.pdf"
      aria-label="Descargar PDF"
      sx={{
        position: 'absolute',
        right: { xs: 48, md: 72 }, // Espacio ajustado para que no se superponga con el botón de cerrar
        top: 8,
        width: { xs: 32, md: 48 },
        height: { xs: 32, md: 48 },
      }}
    >
      <DownloadSimple size={24} />
    </IconButton>

    <IconButton
    aria-label="close"
    onClick={closeDialog}
    sx={{ position: 'absolute', right: 8, top: 8 }}
    />        

    </DialogTitle>
    <DialogContent>
    {pdfUrl && (
            <iframe src={pdfUrl} width="100%" height="500px" title="Vista previa de la factura" />
          )}    </DialogContent>
    <DialogActions>
      <Button onClick={closeDialog} color="primary">
        Cerrar
      </Button>
    </DialogActions>
  </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
}
