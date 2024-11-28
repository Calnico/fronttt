import * as React from 'react'; 
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { config } from '@/config';
import { SalesHistory } from '@/components/dashboard/sales-history/sales-history';

export const metadata: Metadata = { title: config.site.name }; 

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Historial de Ventas</Typography>
      </div>
      <SalesHistory />
    </Stack>
  );
}
