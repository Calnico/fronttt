import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardActions, CardHeader, Divider, Table, TableBody, TableCell, TableHead, TableRow, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography } from '@mui/material';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import dayjs from 'dayjs';
import MuiAlert from '@mui/material/Alert';
import { DownloadSimple } from '@phosphor-icons/react';
import type { SxProps } from '@mui/material/styles';
import Link from 'next/link';
import type {User} from '@/types/user'; 

export interface Order {
  id: string;
  customer: { name: string };
  amount: number;
  createdAt: Date;
}

export interface LatestOrdersProps {
  orders?: Order[];
  sx?: SxProps;
}

export function LatestOrders({ sx }: LatestOrdersProps): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchOrders = async (): Promise<void> => {
      const token = localStorage.getItem('custom-auth-token');
      const UserOrders: User = JSON.parse(localStorage.getItem('user') || '{}');
      const supermarketId = UserOrders.ownedSupermarket?.id || UserOrders.supermarket?.id;
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${supermarketId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
  
      if (response.ok) {
        const salesData: Order[] = await response.json();
        const sortedSales = salesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sortedSales.slice(0, 5)); // Obtener solo las últimas 5 ventas
  
        setSnackbarOpen(false); 
      } else {
        setSnackbarMessage('Error al cargar el historial de ventas');
        setSnackbarSeverity('error');
        setSnackbarOpen(true); 
  
        setTimeout(() => {
          setSnackbarOpen(false);
        }, 3000); 
      }
  
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const fetchInvoice = async (orderId: string): Promise<void> => {
    const token = localStorage.getItem('custom-auth-token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${orderId}/invoice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const newPdfUrl = URL.createObjectURL(blob);
        setPdfUrl(newPdfUrl);
        setDialogOpen(true);
        setSnackbarMessage('Factura cargada correctamente');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Error al cargar la factura');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      setSnackbarMessage('Error al cargar la factura');
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  };

  const closeDialog = (): void => {
    setDialogOpen(false);
    setPdfUrl(null);
  };

  return (
    <Card sx={sx}>
      <CardHeader title="Últimas Ventas" />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        {orders.length === 0 ? (
          <Box sx={{ padding: 2, textAlign: 'center' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body1">No hay ventas disponibles</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="body1">Id de Venta</Typography></TableCell>
                <TableCell><Typography variant="body1">Fecha</Typography></TableCell>
                <TableCell><Typography variant="body1">Ver Factura</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow hover key={order.id}>
                  <TableCell><Typography variant="body1">{order.id}</Typography></TableCell>
                  <TableCell><Typography variant="body1">{dayjs(order.createdAt).format('MMM D, YYYY')}</Typography></TableCell>
                  <TableCell>
                    <Button
                      color="primary"
                      size="small"
                      variant="contained"
                      onClick={() => fetchInvoice(order.id)}
                    >
                      Ver factura
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Link href="/dashboard/sales-history" passHref>
          <Button
            color="secondary"
            endIcon={<ArrowRightIcon fontSize="var(--icon-fontSize-md)" />}
            size="small"
            variant="text"
          >
            Ver todo
          </Button>
        </Link>
      </CardActions>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Ver Factura
          <IconButton
            component="a"
            href={pdfUrl || '#'}
            download="Factura_Venta.pdf"
            aria-label="Descargar PDF"
            sx={{ position: 'absolute', right: 72, top: 8, width: 48, height: 48 }}
          >
            <DownloadSimple size={24} />
          </IconButton>
          <IconButton aria-label="close" onClick={closeDialog} sx={{ position: 'absolute', right: 8, top: 8 }} />
        </DialogTitle>
        <DialogContent>
        {pdfUrl && typeof pdfUrl === 'string' && pdfUrl.trim() && (<iframe src={pdfUrl} width="100%" height="500px" title="Vista previa de la factura" />)}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => { setSnackbarOpen(false); }}>
        <MuiAlert onClose={() => { setSnackbarOpen(false); }} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Card>
  );
}
