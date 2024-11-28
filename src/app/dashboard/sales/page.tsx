import * as React from 'react'; 
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { config } from '@/config';
import { SalesForm } from '@/components/dashboard/sales/sales-form'; // Asegúrate de la ruta de importación

export const metadata: Metadata = { title: config.site.name }; 

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Ventas</Typography>
      </div>
      {/* Llama a SalesForm */}
      <SalesForm />
    </Stack>
  );
}
