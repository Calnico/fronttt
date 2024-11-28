'use client';

import * as React from 'react';
import {Snackbar, Alert } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import type { AuditsParams } from '@/lib/auth/client';
import { translateModule, translateAction, formatDate, formatTime, translateRole } from '@/components/dashboard/audits/translate'


import { useSelection } from '@/hooks/use-selection';
import { useUser } from '@/hooks/use-user';

interface SuccessMessageProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

interface AuditsTableProps {
  count?: number;
  page?: number;
  rows?: AuditsParams[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (user?: AuditsParams) => void;
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

export function AuditsTable({
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
}: AuditsTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => {
    return rows.map((audit) => audit.id);
  }, [rows]);

  const { user } = useUser();
  const { selected } = useSelection(rowIds);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [alertOpen, setAlertOpen] = React.useState(false);

  const handleCloseAlert = (): void => {
    setAlertOpen(false);
    setSuccessMessage(null);
  };

  return (
  <>
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Correo electrónico</TableCell>
              <TableCell>Módulo</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Fecha del cambio</TableCell>
              <TableCell>Hora del cambio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={user?.role !== 'viewer' ? 7 : 6} align="center">
                  No hay auditorías disponibles
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isSelected = selected?.has(row.id);
                return (
                  <TableRow hover key={row.id} selected={isSelected}>
                    <TableCell>
                      {row.user
                        ? `${row.user.firstName} ${row.user.middleName || ''} ${row.user.lastName} ${row.user.secondLastName || ''}`.trim()
                        : ''}
                    </TableCell>
                    <TableCell>{translateRole(row.user.role) || ''}</TableCell>
                    <TableCell>{row.user.email || ''}</TableCell>
                    <TableCell>{translateModule(row.table_name)}</TableCell>
                    <TableCell>{translateAction(row.action)}</TableCell>
                    <TableCell>{formatDate(new Date(row.timestamp).toString())}</TableCell>
                    <TableCell>{formatTime(new Date(row.timestamp).toString())}</TableCell>
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
        count={count} // Total de auditorías
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
