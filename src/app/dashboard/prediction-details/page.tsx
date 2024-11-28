import * as React from 'react';
import PredictionDetails from '@/components/dashboard/predictions/prediction-details'
import { config } from '@/config';
import { Grid, Stack } from '@mui/material';
import type { Metadata } from 'next';


export const metadata: Metadata = { title: config.site.name }; 

export default function PredictionPage(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <PredictionDetails />
        </Grid>
      </Grid>
    </Stack>
  );
}