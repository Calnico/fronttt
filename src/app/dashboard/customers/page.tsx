'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';

import { API_URL } from '@/config';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { CustomersTable } from '@/components/dashboard/customer/customers-table';
import type { Customer } from '@/components/dashboard/customer/customers-table';




export default function Page(): React.JSX.Element {
  const [user, setUser] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const page = 0;
  const rowsPerPage = 5;

  // Función para traer los datos de la API
  const fetchUser = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('custom-auth-token'); // Obtener el token
      const response = await fetch(`${API_URL}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Incluir el token en el encabezado
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data: Customer[] = await response.json(); // Asegúrate de que data tenga el tipo correcto
      setUser(data);
    } catch (error) {
      // Eliminar console.log
      // console.error(error); // Podrías usar un sistema de logging más robusto en producción
      setUser([]); // Manejo seguro del estado en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Llamar a la API cuando el componente se monta
  useEffect(() => {
    fetchUser();
  }, []);

  const paginatedCustomers = applyPagination(user, page, rowsPerPage);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Usuarios</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Importar
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Exportar
            </Button>
          </Stack>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained">
            Añadir
          </Button> 
        </div>
      </Stack>
      <CustomersFilters />
      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <CustomersTable
          count={paginatedCustomers.length}
          page={page}
          rows={paginatedCustomers}
          rowsPerPage={rowsPerPage}
        />
      )}
    </Stack>
  );
}

function applyPagination(rows: Customer[], page: number, rowsPerPage: number): Customer[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
