'use client';

import * as React from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { useSelection } from '@/hooks/use-selection';
import { useUser } from '@/hooks/use-user';

export interface Customer {
  name: any;
  id: number;
  supermarketId: number;
  ownedSupermarket: object;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phoneNumber: string;
  password?: string;
  role: 'admin' | 'viewer' | 'cashier';
}

interface SuccessMessageProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Customer[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (user?: Customer) => void;
  onDelete?: (userId: number) => Promise<void>;
}

export function SuccessMessage({ open, message, onClose }: SuccessMessageProps): React.JSX.Element {
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={onClose}>
      <Alert onClose={onClose} severity="success" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export function CustomersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onPageChange = () => {
    /* No implementation needed */
  },
  onRowsPerPageChange = () => {
    /* No implementation needed */
  },
  onEdit = async () => {
    /* No implementation needed */
  },
  onDelete = async () => {
    /* No implementation needed */
  },
}: CustomersTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => {
    return rows.map((customer) => customer.id);
  }, [rows]);

  const { user } = useUser();
  const { selected } = useSelection(rowIds);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [alertOpen, setAlertOpen] = React.useState(false);

  const handleCloseAlert = (): void => {
    setAlertOpen(false);
    setSuccessMessage(null);
  };

  const handleEdit = async (row: Customer): Promise<void> => {
    onEdit(row);
  };

  const handleDelete = async (userId: number): Promise<void> => {
    await onDelete(userId);
  };

  const roleTranslations: Record<string, string> = {
    admin: 'Administrador',
    viewer: 'Observador',
    cashier: 'Cajero',
  };

  return (
  <>
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Primer Nombre</TableCell>
              <TableCell>Segundo Nombre</TableCell>
              <TableCell>Primer Apellido</TableCell>
              <TableCell>Segundo Apellido</TableCell>
              <TableCell>Correo electrónico</TableCell>
              <TableCell>Número de celular</TableCell>
              <TableCell>Rol</TableCell>
              {user?.role !== 'viewer' && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={user?.role !== 'viewer' ? 8 : 7} align="center">
                  No hay usuarios disponibles
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isSelected = selected?.has(row.id);
                return (
                  <TableRow hover key={row.id} selected={isSelected}>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.middleName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>{row.secondLastName}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phoneNumber}</TableCell>
                    <TableCell>{roleTranslations[row.role]}</TableCell>
                    {user?.role !== 'viewer' && (
                      <TableCell>
                        <Button startIcon={<PencilIcon />} onClick={() => handleEdit(row)}>
                          Editar
                        </Button>
                        <Button startIcon={<TrashIcon />} color="error" onClick={() => handleDelete(row.id)}>
                          Eliminar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <TablePagination
        component="div"
        count={count} // Total de usuarios
        page={page} // Página actual
        onPageChange={onPageChange} // Maneja el cambio de página
        rowsPerPage={rowsPerPage} // Filas por página
        onRowsPerPageChange={onRowsPerPageChange} // Maneja el cambio de filas por página
        rowsPerPageOptions={[5, 10, 25]} // Opciones de filas por página
        labelRowsPerPage="Filas por página"
      />
    </Card>
          <SuccessMessage
          open={alertOpen}
          message={successMessage || ''}
          onClose={handleCloseAlert}
        />
      </>
  );
}
