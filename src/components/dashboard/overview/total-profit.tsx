import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Receipt as ReceiptIcon } from '@phosphor-icons/react/dist/ssr/Receipt';
import axios from 'axios';
import type { User } from '@/types/user';
import { API_URL } from '@/config';

export interface TotalProfitProps {
  sx?: SxProps;
  value?: string; 
}

export function TotalProfit({ sx }: TotalProfitProps): React.JSX.Element {
  const [totalEarnings, setTotalEarnings] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const profitUser : User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = profitUser?.supermarket?.id?.toString() || profitUser?.ownedSupermarket?.id?.toString();
    const token = localStorage.getItem('custom-auth-token');

    if (supermarketId && token) {
      axios
        .get(`${API_URL}/sales/total-earnings/${supermarketId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          const data = response.data as { totalEarnings: number | null };
          setTotalEarnings(data.totalEarnings); // Ahora `setTotalEarnings` está en uso
          setLoading(false);
        })
        .catch((err: unknown) => { // Cambio de nombre de `error` a `err`
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            setError('No autorizado. Verifica tus credenciales.');
          } else {
            setError('No se pudo obtener las ganancias');
          }
          setLoading(false);
        });
    } else {
      setError('No se encontró el ID del supermercado o el token de acceso');
      setLoading(false);
    }
  }, []);

  const formattedValue = totalEarnings !== null ? totalEarnings.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '-';

  return (
    <Card sx={{ width: '200%', ...sx }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="overline">
              Ganancia Total
            </Typography>
            {loading ? (
              <Typography variant="h4">Cargando...</Typography>
            ) : error ? (
              <Typography variant="h4" color="error">
                {error}
              </Typography>
            ) : (
              <Typography variant="h4">{formattedValue}</Typography>
            )}
          </Stack>
          <Avatar sx={{ backgroundColor: 'var(--mui-palette-primary-main)', height: '56px', width: '56px' }}>
            <ReceiptIcon fontSize="var(--icon-fontSize-lg)" />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}