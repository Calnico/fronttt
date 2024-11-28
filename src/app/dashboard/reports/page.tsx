'use client';

import React, { useState, useEffect } from 'react';
import { Checkbox, FormControlLabel, Button, Grid, Typography, CircularProgress, Box, Paper, Snackbar, TextField } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';
import { API_URL } from '@/config';
import { User } from '@/types/user';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ReportOption {
  label: string;
  value: string;
  isTitle?: boolean;
}

interface ProductData {
  nombre?: string;
  nombre_producto?: string;
  cantidad?: string;
  total_vendido?: string;
  categoria?: string;
  cantidad_productos?: string;
  porcentaje_rotacion?: number;
  stock_actual?: number;
  estado?: string;
  status?: string;
}

interface AnalysisData {
  spoiledpercentage: number;
  totalpredictions: string;
  spoiledcount: string;
  avgspoiledconfidence: number;
  halffreshcount: string;
  avghalffreshconfidence: number;
  freshcount: string;
  avgfreshconfidence: number;
}

interface ProfitsData {
  total_ingresos?: number;
  total_costos?: number;
  ganancias_netas?: number;
}


const reportOptions: ReportOption[] = [
  { label: 'Carnes más vendidos', value: 'most-sold' },
  { label: 'Ganancias Totales', value: 'profits' },
  { label: 'Carnes por Usuario', value: 'products-by-user' },
  { label: 'Carnes Menos Vendidos', value: 'least-sold' },
  { label: 'Carnes por Cortes', value: 'products-by-category' },
  //{ label: 'Rotación de Inventario', value: 'inventory-rotation' },
  { label: 'Productos con nivel de stock crítico', value: 'critical-stock' },
  { label: 'Gestión de Calidad de la Carne', value: 'quality-management-title', isTitle: true }, 
  //{ label: 'Frescura de Carnes', value: 'meat-freshness' },
  { label: 'Reporte de predicciones de la calidad de la carne', value: 'status-summary' },
  { label: 'Análisis completo de la calidad de la carne', value: 'analysis' },
  { label: 'Tendencia de la calidad de la carne a lo largo del tiempo', value: 'trend' },
];




const chartConfigurations = {
  'most-sold': {
    title: 'Carnes más vendidos',
    xKey: 'nombre_producto',
    yKey: 'cantidad',
    barColor: '#82ca9d',
  },
  'profits': {
    title: 'Ganancias Totales',
    type: 'summary',
  },
  'meat-freshness': {
    title: 'Frescura de Carnes',
    xKey: 'estado',
    yKey: 'cantidad',
    barColor: '#ffc658',
  },
  'products-by-user': {
    title: 'Carnes',
    xKey: 'nombre_producto',
    yKey: 'total_vendido',
    barColor: '#ffc658',
  },
  'least-sold': {
    title: 'Carnes Menos Vendidos',
    xKey: 'nombre',
    yKey: 'cantidad',
    barColor: '#8884d8',
  },
  'products-by-category': {
    title: 'Carnes por Cortes',
    xKey: 'categoria',
    yKey: 'cantidad_productos',
    barColor: '#ffc658',
  },
  'inventory-rotation': {
    title: 'Rotación de Inventario',
    xKey: 'nombre_producto',
    yKey: 'porcentaje_rotacion',
    barColor: '#ff7300',
  },
  'status-summary': {
    title: 'Calidad de la carne',
    xKey: 'status',
    yKey: 'cantidad',
    barColor: '#ff7300',
  },
  'analysis': {
    title: 'Tendencia de la Calidad de la Carne',
    type: 'combination',
  },
  'trend': {
    title: 'Tendencia de la Calidad de la Carne a lo Largo del Tiempo',
    type: 'line',
  },
  'critical-stock': {
    title: 'Productos con Stock Crítico',
    xKey: 'nombre_producto',
    yKey: 'stock_actual',
    barColor: '#d62728',
  },
};



export default function ReportPage(): React.JSX.Element {
  const [startDate, setStartDate] = useState<string>(''); // Fecha de inicio
  const [endDate, setEndDate] = useState<string>(''); // Fecha de fin
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [supermarketId, setSupermarketId] = useState<string>('');
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [allSelected, setAllSelected] = useState(false);

  const showSnackbar = (message: string): void => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (): void => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        const fetchedUserId = user?.id?.toString();
        const id = user?.supermarket?.id?.toString() || user?.ownedSupermarket?.id?.toString();
        if (id) {
          setSupermarketId(id);
        } else {
          showSnackbar("No se encontró el ID del supermercado en los datos del usuario.");
        }
        if (fetchedUserId) {
          setUserId(fetchedUserId); // Asegúrate de tener un estado `userId` definido con `useState`
        } else {
          showSnackbar("No se encontró el ID del usuario en los datos almacenados.");
        }
      } catch (error) {
        showSnackbar("Error al parsear el usuario almacenado.");
      }
    } else {
      showSnackbar("No se encontró el usuario en el almacenamiento local.");
    }
  }, []);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value, checked } = event.target;
    setSelectedReports(prevState =>
      checked ? [...prevState, value] : prevState.filter(report => report !== value)
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedReports([]); 
    } else {
      const allReportValues = reportOptions.filter(option => !option.isTitle).map(option => option.value);
      setSelectedReports(allReportValues); 
    }
    setAllSelected(!allSelected); 
  };

  const fetchReports = async (): Promise<void> => {
    if (!supermarketId) {
      showSnackbar("No se encontró el ID del supermercado.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('custom-auth-token');
      const data: Record<string, any> = {};

      for (const report of selectedReports) {
        const url = `${API_URL}/reports/${report}?supermarketId=${supermarketId}&endDate=${endDate}&startDate=${startDate}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching report data for ${report}`);
        }

        const reportResult = await response.json();
        data[report] = reportResult;
      }

      setReportData(data);
    } catch (error) {
      showSnackbar('Error fetching reports:');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (reportKey: string, data: ProductData[]): React.JSX.Element | null => {
    const config = chartConfigurations[reportKey as keyof typeof chartConfigurations];
    
    // Si no hay configuración, retornar null
    if (!config) return null;

    if (reportKey === 'trend') {
      const trendData = data as {
        date: string;
        status: string;
        count: string;
        avgSpoiledConfidence: number;
        avgFreshConfidence: number;
        avgHalfFreshConfidence: number;
      }[];
  
      // Transformar los datos para el gráfico
      const formattedData = trendData.map((item) => ({
        date: item.date,
        count: Number(item.count),
        avgSpoiledConfidence: item.avgSpoiledConfidence,
        avgFreshConfidence: item.avgFreshConfidence,
        avgHalfFreshConfidence: item.avgHalfFreshConfidence,
      }));
  
      return (
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" label={{ value: "Count", angle: -90, position: "insideLeft" }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "Confidence (%)", angle: -90, position: "insideRight" }}
              tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
            />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Count" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgSpoiledConfidence"
              stroke="#ff7300"
              name="Spoiled Confidence"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgFreshConfidence"
              stroke="#82ca9d"
              name="Fresh Confidence"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgHalfFreshConfidence"
              stroke="#ffc658"
              name="Half-Fresh Confidence"
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Render específico para 'analysis'
  if (reportKey === 'analysis') {
    const analysisData = data as unknown as AnalysisData; // Conversión segura

    // Validar que `analysisData` tenga las propiedades esperadas
    if (
      !analysisData?.spoiledpercentage ||
      !analysisData?.totalpredictions ||
      !analysisData?.spoiledcount
    ) {
      return (
        <Typography variant="body2" textAlign="center" color="textSecondary">
          No hay datos válidos para este reporte.
        </Typography>
      );
    }

    // Transformar los datos para el gráfico
    const transformedData = [
      { label: 'Spoiled', count: Number(analysisData.spoiledcount), confidence: analysisData.avgspoiledconfidence },
      { label: 'Half-Fresh', count: Number(analysisData.halffreshcount), confidence: analysisData.avghalffreshconfidence },
      { label: 'Fresh', count: Number(analysisData.freshcount), confidence: analysisData.avgfreshconfidence },
    ];

    return (
      <>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={transformedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" orientation="left" label={{ value: "Count", angle: -90, position: "insideLeft" }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "Confidence (%)", angle: -90, position: "insideRight" }}
              tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
            />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#82ca9d" name="Count" barSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#8884d8" name="Confidence" />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Resumen en texto */}
        <Box sx={{ marginTop: 3, textAlign: 'center' }}>
          <Typography variant="body1">Total Predictions: {analysisData.totalpredictions}</Typography>
          <Typography variant="body1">Spoiled Percentage: {`${analysisData.spoiledpercentage.toFixed(2)}%`}</Typography>
        </Box>
      </>
    );
  }

    if ('type' in config && config.type === 'summary') {
      const profitsData = data as ProfitsData | undefined;
      if (
        !profitsData?.total_ingresos ||
        !profitsData?.total_costos ||
        !profitsData?.ganancias_netas
      ) {
        return (
          <Typography variant="body2" textAlign="center" color="textSecondary">
            No hay datos válidos para este reporte.
          </Typography>
        );
      }
  
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 2,
            border: '1px solid #ddd',
            borderRadius: 2,
            backgroundColor: '#f9f9f9',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" fontWeight="bold">Total Ingresos</Typography>
              <Typography variant="body2">${profitsData.total_ingresos.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" fontWeight="bold">Total Costos</Typography>
              <Typography variant="body2">${profitsData.total_costos.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" fontWeight="bold">Ganancias Netas</Typography>
              <Typography variant="body2">${profitsData.ganancias_netas.toLocaleString()}</Typography>
            </Box>
          </Box>
        </Box>
      );
    }
  
    // Filtrar datos válidos para el eje X
    if ('xKey' in config && 'yKey' in config) {
    const validData = data.filter(
      (item) => item[config.xKey as keyof ProductData] !== undefined
    );
  
    // Si no hay datos válidos, mostrar un mensaje de "sin datos"
    if (validData.length === 0) {
      return (
        <Typography variant="body2" textAlign="center" color="textSecondary">
          No hay datos válidos para este reporte.
        </Typography>
      );
    }
  
    // Calcular el máximo para el eje Y
    const maxCantidad = Math.max(
      ...validData.map((item) => Number(item[config.yKey as keyof ProductData]) || 0)
    );
    const step = Math.ceil(maxCantidad / 10);
    const yTicks = Array.from({ length: 11 }, (_, i) => i * step);
  
    if (Array.isArray(data) && data.length > 0) {
      const filteredData = data;
    // Renderizar el gráfico
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={filteredData.slice(0, 10)} // Limitar a 10 productos
          barGap={10}
          barCategoryGap="20%"
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <XAxis
            dataKey={config.xKey} // Asegurar que xKey es una cadena
            tickFormatter={(name: unknown) => {
              if (typeof name === 'string') {
                return name.length > 15 ? `${name.slice(0, 15)}...` : name;
              }
              return ''; // Valor predeterminado si name no es una cadena
            }}
          />
          <YAxis domain={[0, maxCantidad]} ticks={yTicks} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey={config.yKey}
            fill={config.barColor}
            barSize={40}
            name={config.title}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
    }
    return null;
};

  const exportToPDF = () => {
     // eslint-disable-next-line new-cap -- Utilizamos `new jsPDF()` como una excepción ya que el nombre viene de una biblioteca externa que no sigue esta convención.
    const doc = new jsPDF();
  
    // Título principal del PDF
    doc.setFontSize(18);
    doc.text('Reportes Generados', 10, 15);
  
    let currentY = 30; // Posición vertical inicial
  
    Object.keys(reportData)
      .filter((key): key is keyof typeof chartConfigurations => key in chartConfigurations)
      .forEach((reportKey, index) => {
        const config = chartConfigurations[reportKey];
        const data = reportData[reportKey];
  
        // Encabezado en cada página
        if (index > 0 && currentY === 30) {
          doc.setFontSize(18);
          doc.text('Reportes Generados', 10, 15);
        }

        if (reportKey === 'analysis') {
          const analysisData = data as unknown as AnalysisData; // Conversión segura
        
          if (
            !analysisData?.spoiledpercentage ||
            !analysisData?.totalpredictions
          ) {
            doc.setFontSize(14);
            doc.text('Tendencia de la Calidad de la Carne', 10, currentY);
            currentY += 10;
            doc.setFontSize(12);
            doc.text('No hay datos disponibles para este reporte.', 10, currentY);
            currentY += 20;
            return;
          }
        
          doc.setFontSize(14);
          doc.text(config?.title || 'Tendencia de la Calidad de la Carne', 10, currentY);
          currentY += 10;
        
          doc.setFontSize(12);
          doc.text(`Total Predictions: ${analysisData.totalpredictions}`, 10, currentY);
          currentY += 10;
          doc.text(`Spoiled Percentage: ${analysisData.spoiledpercentage.toFixed(2)}%`, 10, currentY);
          currentY += 10;
        
          // Tabular data
          doc.autoTable({
            startY: currentY,
            head: [['Label', 'Count', 'Confidence']],
            body: [
              ['Spoiled', analysisData.spoiledcount, `${(analysisData.avgspoiledconfidence * 100).toFixed(2)}%`],
              ['Half-Fresh', analysisData.halffreshcount, `${(analysisData.avghalffreshconfidence * 100).toFixed(2)}%`],
              ['Fresh', analysisData.freshcount, `${(analysisData.avgfreshconfidence * 100).toFixed(2)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
            bodyStyles: { textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { left: 10, right: 10 },
          });
        
          const finalY = doc.lastAutoTable?.finalY ?? 0; // Usar un valor predeterminado si `finalY` es undefined

          currentY = finalY + 20;

          if (currentY > 270) {
            doc.addPage();
            currentY = 30;
          }
          return;
        }

        if (reportKey === 'trend') {
          const trendData = data as {
            date: string;
            status: string;
            count: string;
            avgSpoiledConfidence: number;
            avgFreshConfidence: number;
            avgHalfFreshConfidence: number;
          }[];
        
          doc.setFontSize(14);
          doc.text(config?.title || 'Tendencia de la Calidad de la Carne a lo Largo del Tiempo', 10, currentY);
          currentY += 10;
        
          // Crear una tabla para mostrar las tendencias
          doc.autoTable({
            startY: currentY,
            head: [['Date', 'Status', 'Count', 'Spoiled Confidence', 'Fresh Confidence', 'Half-Fresh Confidence']],
            body: trendData.map((item) => [
              item.date,
              item.status,
              item.count,
              `${(item.avgSpoiledConfidence * 100).toFixed(2)}%`,
              `${(item.avgFreshConfidence * 100).toFixed(2)}%`,
              `${(item.avgHalfFreshConfidence * 100).toFixed(2)}%`,
            ]),
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
            bodyStyles: { textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { left: 10, right: 10 },
          });
        
          const finalY = doc.lastAutoTable?.finalY ?? 0; // Usar un valor predeterminado si `finalY` es undefined

          currentY = finalY + 20;
        
          if (currentY > 270) {
            doc.addPage();
            currentY = 30;
          }
          return;
        }
  
        // Si el reporte es de 'profits', renderizar como un resumen
        if (reportKey === 'profits') {
          const profitsData = data as ProfitsData | undefined;
  
          // Validar datos de 'profits'
          if (
            !profitsData?.total_ingresos ||
            !profitsData?.total_costos ||
            !profitsData?.ganancias_netas
          ) {
            doc.setFontSize(14);
            doc.text('Ganancias Totales', 10, currentY);
            currentY += 10;
            doc.setFontSize(12);
            doc.text('No hay datos disponibles para Ganancias Totales.', 10, currentY);
            currentY += 20;
            return;
          }
  
          // Renderizar datos de 'profits'
          doc.setFontSize(14);
          doc.text(config?.title || 'Ganancias Totales', 10, currentY);
          currentY += 10;
  
          doc.setFontSize(12);
          doc.text(`Total Ingresos: $${profitsData.total_ingresos.toLocaleString()}`, 10, currentY);
          currentY += 10;
          doc.text(`Total Costos: $${profitsData.total_costos.toLocaleString()}`, 10, currentY);
          currentY += 10;
          doc.text(`Ganancias Netas: $${profitsData.ganancias_netas.toLocaleString()}`, 10, currentY);
          currentY += 20;
  
          // Agregar un salto de página si excede el límite
          if (currentY > 270) {
            doc.addPage();
            currentY = 30; 
          }
          return;
        }
        
  
        // Renderizar otros reportes como tablas dinámicas
        if (Array.isArray(data) && data.length > 0) {
          doc.setFontSize(14);
          doc.text(config?.title || reportKey, 10, currentY);
          currentY += 10;
  
          const tableHead = Object.keys(data[0] as Record<string, any>);
          const tableBody: string[][] = data.map((item: Record<string, any>) =>
            tableHead.map((column) => String(item[column] || 'N/A'))
          );
  
          doc.autoTable({
            startY: currentY,
            head: [tableHead],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
            bodyStyles: { textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { left: 10, right: 10 },
          });
  
          const finalY = doc.lastAutoTable?.finalY ?? 0; // Usar un valor predeterminado si `finalY` es undefined

          currentY = finalY + 20;
  
          if (currentY > 270) {
            doc.addPage();
            currentY = 30;
          }
        } else {
          // Reporte sin datos
          doc.setFontSize(14);
          doc.text(`Reporte: ${config?.title || reportKey}`, 10, currentY);
          doc.setFontSize(12);
          doc.text('No hay datos disponibles para este reporte.', 10, currentY + 10);
          currentY += 20;
        }
      });
    doc.save('reportes.pdf');
  };
  return (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12}>
        <Typography variant="h4" textAlign="center" sx={{ marginBottom: 2 }}>
          Generar Reportes
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} sx={{ padding: 2 }}>
          <Typography variant="h6" textAlign="center">
            Selecciona los reportes:
          </Typography>
          <br />
          <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginBottom: 4 }}
          onClick={toggleSelectAll}
        >
          {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
        </Button>
          <Typography variant="h6">Finanzas e Inventario</Typography>
  
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1, // Espaciado uniforme entre opciones
            }}
          >
            {reportOptions.map((option) =>
              option.isTitle ? ( // Verifica si el elemento es un título
                <Typography
                  key={option.value}
                  variant="h6"
                >
                  {option.label}
                </Typography>
              ) : (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      value={option.value}
                      onChange={handleCheckboxChange}
                      checked={selectedReports.includes(option.value)}
                    />
                  }
                  label={option.label}
                  sx={{ marginLeft: 0 }}
                />
              )
            )}
          </Box>
        </Paper>
      </Grid>
       {/* Campos de fecha */}
    <Grid item xs={12} sm={6} md={4}>
      <Paper elevation={3} sx={{ padding: 2 }}>
        <Typography variant="h6" textAlign="center" sx={{ marginBottom: 3 }}>
          Selecciona el rango de fechas:
        </Typography>
        <Box>
          <TextField
            label="Fecha de inicio"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Fecha de fin"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
        </Box>
      </Paper>
    </Grid>
      <Grid item xs={12} textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={fetchReports}
          disabled={
            loading || 
            selectedReports.length === 0
          }
        >
          {loading ? <CircularProgress size={24} /> : 'Generar Reportes'}
        </Button>
      </Grid>
      {Object.keys(reportData)
  .filter((key): key is keyof typeof chartConfigurations => key in chartConfigurations)
  .map((key) => (
    <Grid item xs={12} key={key}>
      <Typography variant="h6" textAlign="center" gutterBottom>
        {chartConfigurations[key]?.title}
      </Typography>
      {Array.isArray(reportData[key]) ? (
    renderChart(key, reportData[key] as ProductData[])
  ) : (
    <Typography variant="body2" color="textSecondary" textAlign="center">
      No hay datos disponibles para este reporte.
    </Typography>
  )}
    </Grid>
  ))}
      {Object.keys(reportData).length > 0 && (
        <Grid item xs={12} textAlign="center">
          <Button variant="contained" color="secondary" onClick={exportToPDF}>
            Exportar a PDF
          </Button>
        </Grid>
      )}
      <Snackbar
        open={openSnackbar}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        autoHideDuration={3000}
      />
    </Grid>
  );
}