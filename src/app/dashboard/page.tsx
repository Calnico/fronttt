'use client';

import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import dayjs from 'dayjs';

import { dashboardClient, type Product } from '@/lib/dashboard/client';
import { LatestOrders } from '@/components/dashboard/overview/latest-orders';
import { LatestProducts } from '@/components/dashboard/overview/latest-products';
import { Sales } from '@/components/dashboard/overview/sales';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';

export default function Page(): React.JSX.Element {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      const { error, data } = await dashboardClient.getLatestProducts();
      if (error) {
        return;
      }

      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid lg={6} sm={6} xs={12}>
        <TotalProfit sx={{ height: '100%' }} value="$15k" />
      </Grid>
      <Grid lg={12} xs={12}>
        <Sales
          chartSeries={[
            { name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20] },
            { name: 'Last year', data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13] },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid lg={4} md={6} xs={12}>
        <LatestProducts products={products} sx={{ height: '100%' }} />
      </Grid>
      <Grid lg={8} md={12} xs={12}>
        <LatestOrders
          orders={[
            { id: 'ORD-007', customer: { name: 'Ekaterina Tankova' }, amount: 30.5, createdAt: dayjs().subtract(10, 'minutes').toDate() },
            // ...otros pedidos
          ]}
          sx={{ height: '100%' }}
        />
      </Grid>
    </Grid>
  );
}

