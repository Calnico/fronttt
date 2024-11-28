'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { ArrowClockwise as ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import type { ApexOptions } from 'apexcharts';
import { API_URL } from '@/config';

import { Chart } from '@/components/core/chart';
import type { User } from '@/types/user';

interface SalesData {
  thisYear: number[];
  lastYear: number[];
}

export interface SalesProps {
  sx?: SxProps;
  chartSeries: { name: string; data: number[] }[];
}

export function Sales({ sx }: SalesProps): React.JSX.Element {
  const [chartSeries, setChartSeries] = useState<{ name: string; data: number[] }[]>([]);
  const chartOptions = useChartOptions();
  const [supermarketId, setSupermarketId] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const handleSyncClick = (): void => {
    if (supermarketId) {
      setSnackbarMessage('Sincronizando...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      fetchChartData(); 
    }
  };

  const fetchChartData = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem('custom-auth-token');
      const url = `${API_URL}/sales/chart-data/${supermarketId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Error en la respuesta de red (${response.status}): ${errorDetail}`);
      }

      const salesData: SalesData = await response.json();
      if (salesData.thisYear && salesData.lastYear) {
        setChartSeries([
          { name: 'Este Año', data: salesData.thisYear },
          { name: 'Año Pasado', data: salesData.lastYear },
        ]);
      }
    } catch (error) {
      setSnackbarMessage('Error al cargar los datos del gráfico');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [supermarketId]);

  useEffect(() => {
    if (supermarketId) {
      fetchChartData(); // Cargar los datos cuando se obtiene el ID del supermercado
    }
  }, [supermarketId, fetchChartData]);

  useEffect(() => {
    const user: User = JSON.parse(localStorage.getItem('user') || '{}');
    const salesSupermarketId = user?.supermarket?.id?.toString() || user?.ownedSupermarket?.id?.toString();

    if (salesSupermarketId) {
      setSupermarketId(salesSupermarketId);
    }
  }, []);


  return (
    <Card sx={sx}>
      <CardHeader
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<ArrowClockwiseIcon fontSize="var(--icon-fontSize-md)" />}
            onClick={handleSyncClick} // Agregar el evento para sincronizar
          >
            Sincronizar
          </Button>
        }
        title="Ventas"
      />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartSeries} type="bar" width="100%" />
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="inherit"
          endIcon={<ArrowRightIcon fontSize="var(--icon-fontSize-md)" />}
          size="small"
        >
          Descripción general
        </Button>
      </CardActions>
    </Card>
  );
}

function useChartOptions(): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', stacked: false, toolbar: { show: false } },
    colors: [theme.palette.primary.main, alpha(theme.palette.primary.main, 0.25)],
    dataLabels: { enabled: false },
    fill: { opacity: 1, type: 'solid' },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { show: false },
    plotOptions: { bar: { columnWidth: '40px' } },
    stroke: { colors: ['transparent'], show: true, width: 2 },
    theme: { mode: theme.palette.mode },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      labels: { offsetY: 5, style: { colors: theme.palette.text.secondary } },
    },
    yaxis: {
      labels: {
        formatter: (value) => (value > 0 ? `${value}K` : `${value}`),
        offsetX: -10,
        style: { colors: theme.palette.text.secondary },
      },
    },
  };
}
