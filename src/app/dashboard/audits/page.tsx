'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Menu, MenuItem, Snackbar, Alert, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { API_URL } from '@/config';
import { AuditsFilters } from '@/components/dashboard/audits/audits-filters';
import { AuditsTable } from '@/components/dashboard/audits/audits-table';
import type { AuditsParams } from '@/lib/auth/client';
import type  { User } from '@/types/user';
import { translateModule, translateAction, formatDate, formatTime, translateRole } from '@/components/dashboard/audits/translate'

export default function Page(): React.JSX.Element {
  const [audits, setAudits] = useState<AuditsParams[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const filteredAudits = audits.filter((audit) => {
    const translatedName = translateModule(audit.table_name || '').toLowerCase();
    const translatedAction = translateAction(audit.action || '').toLowerCase();
    const translatedRole = translateRole(audit.user.role || '').toLowerCase();
    const fullName = `${audit.user.firstName} ${audit.user.middleName || ''} ${audit.user.lastName} ${audit.user.secondLastName || ''}`.toLowerCase();
    const fullEmail = audit.user.email.toLowerCase();
    return (
      translatedName.includes(searchTerm.toLowerCase()) ||
      translatedAction.includes(searchTerm.toLowerCase()) ||
      translatedRole.includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase()) ||
      fullEmail.includes(searchTerm.toLowerCase())
    );
  });

  const fetchAudits = useCallback(async (): Promise<void> => {
    const userPredic: User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = userPredic?.supermarket?.id || userPredic?.ownedSupermarket?.id;
    if (!supermarketId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('custom-auth-token');
      const response = await fetch(`${API_URL}/audits/supermarket/${supermarketId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar las auditorías');
      const auditsData: AuditsParams[] = await response.json() as AuditsParams[];
      const sortedAudits = auditsData.sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });      
      setAudits(sortedAudits);
    } catch (error) {
      showSnackbar('Error al cargar las auditorías', 'error');
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const handleExportExcel = (): void => {
    if (audits.length === 0) {
      showSnackbar('No hay datos para exportar', 'error');
      return;
    }

  // Transformar los datos con traducciones
  const translatedData = audits.map((audit) => ({
    'Usuario': audit.user ? `${audit.user.firstName} ${audit.user.middleName || ''} ${audit.user.lastName} ${audit.user.secondLastName || ''}`.trim() : '',
    'Rol': translateRole(audit.user.role || ''),
    'Correo electrónico': (audit.user.email || ''),
    'Módulo': translateModule(audit.table_name || ''),
    'Acción': translateAction(audit.action || ''),
    'Fecha del cambio': formatDate(audit.timestamp || ''),
    'Hora del cambio': formatTime(audit.timestamp || ''),
  }));

  const worksheet = XLSX.utils.json_to_sheet(translatedData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditorías');
  XLSX.writeFile(workbook, 'auditorias.xlsx');
  handleCloseMenu();
  showSnackbar('Exportado a Excel con éxito', 'success');
};

  const handleExportPDF = (): void => {
    // eslint-disable-next-line new-cap -- Utilizamos `new jsPDF()` como una excepción ya que el nombre viene de una biblioteca externa que no sigue esta convención.
    const doc = new jsPDF();
    doc.text('Lista de Auditorías', 10, 10);

  // Transformar los datos con traducciones
  const columns = ['Usuario', 'Rol', 'Correo electrónico', 'Módulo', 'Acción', 'Fecha del cambio', 'Hora del cambio'];
  const rows = audits.map((audit) => [
    audit.user ? `${audit.user.firstName} ${audit.user.middleName || ''} ${audit.user .lastName} ${audit.user.secondLastName || ''}`.trim() : '',
    translateRole(audit.user.role || ''),
    audit.user.email || '',
    translateModule(audit.table_name || ''),
    translateAction(audit.action || ''),
    formatDate(audit.timestamp || ''),
    formatTime(audit.timestamp || ''),
  ]);

  doc.autoTable({
    head: [columns],
    body: rows,
  });

  doc.save('auditorias.pdf');
  handleCloseMenu();
  showSnackbar('Exportado a PDF con éxito', 'success');
};

  const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };

  const handleChangePage = (event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAudits = applyPagination(filteredAudits, audits, page, rowsPerPage);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Auditorías</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              color="inherit"
              startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={handleClickMenu}
            >
              Exportar
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              <MenuItem onClick={handleExportPDF}>Exportar a PDF</MenuItem>
              <MenuItem onClick={handleExportExcel}>Exportar a Excel</MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Stack>
      <AuditsFilters onSearch={setSearchTerm} />
      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <AuditsTable
          count={audits.length}
          page={page}
          rows={paginatedAudits}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

function applyPagination(rows: AuditsParams[], _audits: AuditsParams[], page: number, rowsPerPage: number): AuditsParams[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}