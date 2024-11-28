'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, InputLabel, Menu, MenuItem, Select, Snackbar, Alert} from '@mui/material';
import Button from '@mui/material/Button';
// import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { jsPDF } from 'jspdf';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';


import { API_URL } from '@/config';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { CustomersTable } from '@/components/dashboard/customer/customers-table';
import type { Customer } from '@/components/dashboard/customer/customers-table';

import 'jspdf-autotable';

import { Controller, useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

import { useUser } from '@/hooks/use-user';

export default function Page(): React.JSX.Element {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [user, setUser] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = React.useState<boolean>();
  const [isPending] = React.useState<boolean>(false);

  useEffect(() => {
    const allowedRoles = ['admin', 'owner', 'viewer'];
    if (currentUser && !allowedRoles.includes(currentUser.role)) {
      router.replace('errors/not-found');
    }
  }, [currentUser, router]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      secondLastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: '',
    },
    mode: 'onChange'
  });

 const translatedRole = (result: string): string => {
    const translations: Record<string, string> = {
      "admin": 'Administrador',
      "viewer": 'Observador',
      "cashier": 'Cajero',
    };
  
    return translations[result] || result;
  };

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };  

  const filteredCustomers = user.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.middleName || ''} ${customer.lastName} ${customer.secondLastName || ''}`.toLowerCase();
    const email = customer.email.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
    );
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchUser = useCallback(async (): Promise<void> => {
    let retryCount = 0;
    const maxRetries = 3; // Limitar los reintentos
  
    while (retryCount < maxRetries) {
      try {
        interface User {
          ownedSupermarket?: { id: string };
          supermarket?: { id: string };
        }
        const storedUser: User = JSON.parse(localStorage.getItem('user') || '{}');
        const supermarketId = storedUser.ownedSupermarket?.id || storedUser.supermarket?.id;
        const token = localStorage.getItem('custom-auth-token');
        const response = await fetch(`${API_URL}/users/supermarket/${supermarketId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const clearStorageAndReload = (): void => {
          localStorage.clear();
          window.location.reload();  // Recarga la página después de limpiar el almacenamiento
        };
        
        // Puedes usar esto en el caso de un error 401
        if (response.status === 401) {
          clearStorageAndReload();
        }
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data: Customer[] = await response.json();
        data.sort((a, b) => b.id - a.id);
        setUser(data);
        break; // Si todo va bien, rompe el ciclo y no reintenta
      } catch (error) {
        retryCount += 1;  
        if (retryCount >= maxRetries) {
          setUser([]);
          showErrorMessage('Error al cargar los usuarios después de varios intentos');
          break; // Para evitar un loop infinito si no puede completar los llamados
        }
      } finally {
        setLoading(false);
      }
    }
  }, []);  

  useEffect(() => {
    fetchUser(); // Cargar datos si todo está bien
  }, [fetchUser]); // El efecto solo se ejecutará si `fetchUser` cambia
  

  const handleOpenModal = (selectedUser?: Customer): void => {
    setEditingUser(selectedUser || null);

    if (selectedUser) {
      (Object.keys(selectedUser) as (keyof Customer)[]).forEach((key) => {
        if (
          [
            'firstName',
            'middleName',
            'lastName',
            'secondLastName',
            'email',
            'phoneNumber',
            'password',
            'role',
          ].includes(key)
        ) {
          const value = selectedUser[key];

          setValue(
            key as
              | 'firstName'
              | 'middleName'
              | 'lastName'
              | 'secondLastName'
              | 'email'
              | 'phoneNumber'
              | 'password'
              | 'role',
            value ? String(value) : ''
          );
        }
      });
    } else {
      reset();
    }

    setModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const handleFormSubmit = async (data: any): Promise<void> => {
    const submitUser = localStorage.getItem('user');
  
    interface User {
      id: string;
      ownedSupermarket?: { id: string };
      password?: string;
      supermarketId?: number;
    }
  
    if (!submitUser) {
      return;
    }
  
    const userObject: User = JSON.parse(submitUser);
  
    const updatedFormData: Partial<User> = {
      ...data,
      supermarketId: userObject.ownedSupermarket?.id,
    };
  
    if (editingUser) {
      if ('password' in updatedFormData) {
        delete updatedFormData.password;
      }
      if ('supermarketId' in updatedFormData) {
        delete updatedFormData.supermarketId;
      }
    }
  
    try {
      const token = localStorage.getItem('custom-auth-token');
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
  
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updatedFormData }),
      });
  
      if (!response.ok) {
        showSnackbar('El correo ya está registrado. Por favor, use otro', 'error');
        return;
      }
  
      const savedUser: Customer = await response.json();
      
      if (!editingUser) {
        setUser((prevUsers) => [savedUser, ...prevUsers]);
      } else {
        setUser((prevUsers) => 
          prevUsers.map((editUser) => (editUser.id === savedUser.id ? savedUser : editUser))
        );
      }
  
      // Mostrar el mensaje después de que se haya completado la operación
      showSnackbar(editingUser ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito', 'success');
      
      fetchUser();  // Actualiza la lista de usuarios
      handleCloseModal();  // Cierra el modal después de completar la acción
      reset();  // Limpia el formulario
    } catch (error) {
      showSnackbar('El correo ya está registrado. Por favor, use otro', 'error');
    }
  };  

  const handleDeleteUser = async (userId: number): Promise<void> => {
    setUserToDelete(userId);
    setDialogOpen(true);
  };

  const handleExportExcel = (): void => {
    if (user.length === 0) {
      showErrorMessage('No hay datos para exportar');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      user.map((userXLSXL) => ({
        'Primer Nombre': userXLSXL.firstName || '',
        'Segundo Nombre': userXLSXL.middleName || '',
        'Primer Apellido': userXLSXL.lastName || '',
        'Segundo Apellido': userXLSXL.secondLastName || '',
        'Correo Electrónico': userXLSXL.email || '',
        'Número de Celular': userXLSXL.phoneNumber || '',
        'Rol': translatedRole(userXLSXL.role || ''),
      }))
    );

    const headerCell = worksheet['!rows'] || [];
    headerCell[0] = { hpt: 18, hpx: 18 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

    XLSX.writeFile(workbook, 'usuarios.xlsx');
    handleCloseMenu();
    showSuccessMessage('Exportado a Excel con éxito');
  };
  const handleExportPDF = (): void => {
    // eslint-disable-next-line new-cap -- Utilizamos `new jsPDF()` como una excepción ya que el nombre viene de una biblioteca externa que no sigue esta convención.
    const doc = new jsPDF();
    doc.text('Lista de Usuarios', 10, 10);

    const columns = ['Primer Nombre', 'Apellido', 'Correo Electrónico', 'Número de Celular', 'Rol'];
    const rows = user.map((userPdf) => [
      userPdf.firstName,
      userPdf.lastName,
      userPdf.email,
      userPdf.phoneNumber,
      translatedRole(userPdf.role),
    ]);

    doc.autoTable({
      head: [columns],
      body: rows,
    });

    doc.save('usuarios.pdf');
    handleCloseMenu();
    showSuccessMessage('Exportado a PDF con éxito');
  };

  const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };

  const showSuccessMessage = (message: string): void => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const showErrorMessage = (message: string): void => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000);
  };
  
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };
  

  const paginatedCustomers = applyPagination(filteredCustomers, user, page, rowsPerPage);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Usuarios</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {/* <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Importar
            </Button> */}
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
        {currentUser?.role !== 'viewer' && (
          <div>
            <Button
              startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
              variant="contained"
              onClick={() => {
                handleOpenModal();
              }}
            >
              Añadir
            </Button>
          </div>
        )}
      </Stack>
      <CustomersFilters onSearch={setSearchTerm} />
      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <CustomersTable
          count={user.length}
          page={page}
          rows={paginatedCustomers}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onEdit={handleOpenModal}
          onDelete={handleDeleteUser}
        />
      )}

      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Stack
          spacing={2}
          sx={{
            padding: 4,
            backgroundColor: 'white',
            width: '90%',
            maxWidth: '400px',
            margin: 'auto',
            marginTop: '50px',
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
          }}
        >
          <Typography variant="h6">{editingUser ? 'Editar Usuario' : 'Agregar Usuario'}</Typography>
          <Controller
            name="firstName"
            control={control}
            rules={{ required: 'El primer nombre es obligatorio' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Primer Nombre"
                fullWidth
                error={Boolean(errors.firstName)}
                helperText={errors.firstName ? errors.firstName.message : ''}
                inputProps={{ maxLength: 50,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  },
                  onKeyPress: (event) => {
                    if (!/^[A-Za-zÀ-ÿ\s]$/.test(event.key)) {
                      event.preventDefault();
                    }
                  }
                 }}
                required
              />
            )}
          />

          <Controller
            name="middleName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Segundo Nombre"
                fullWidth
                error={Boolean(errors.middleName)}
                helperText={errors.middleName?.message}
                inputProps={{ maxLength: 50,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  },
                  onKeyPress: (event) => {
                    if (!/^[A-Za-zÀ-ÿ\s]$/.test(event.key)) {
                      event.preventDefault();
                    }
                  }
                 }}
              />
            )}
          />

          <Controller
            name="lastName"
            control={control}
            rules={{ required: 'El primer apellido es obligatorio' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Primer Apellido"
                fullWidth
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                inputProps={{ maxLength: 50,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  },
                  onKeyPress: (event) => {
                    if (!/^[A-Za-zÀ-ÿ\s]$/.test(event.key)) {
                      event.preventDefault();
                    }
                  }
                 }}
                required
              />
            )}
          />

          <Controller
            name="secondLastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Segundo Apellido"
                fullWidth
                error={Boolean(errors.secondLastName)}
                helperText={errors.secondLastName?.message}
                inputProps={{ maxLength: 50,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  },
                  onKeyPress: (event) => {
                    if (!/^[A-Za-zÀ-ÿ\s]$/.test(event.key)) {
                      event.preventDefault();
                    }
                  }
                 }}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            rules={{
              required: 'El correo electrónico es obligatorio',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: 'El formato del correo es inválido',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Correo Electrónico"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                inputProps={{ maxLength: 255,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                 }}
                required
              />
            )}
          />

          <Controller
            name="phoneNumber"
            control={control}
            rules={{
              required: 'El número de celular es obligatorio',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'El número de celular debe tener 10 dígitos',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Número de Celular"
                fullWidth
                error={Boolean(errors.phoneNumber)}
                helperText={errors.phoneNumber?.message}
                inputProps={{ maxLength: 10,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                 }}
                onKeyPress={(event) => {
                  if (!/[0-9]/.test(event.key)) {
                    event.preventDefault();
                  }
                }}
                required
              />
            )}
          />
    {!editingUser && (
      <Controller
            name="password"
            control={control}
            rules={{
              required: 'La contraseña es obligatoria',
              minLength: {
                value: 9,
                message: 'La contraseña debe tener al menos 9 caracteres',
              },
              maxLength: {
                value: 20,
                message: 'La contraseña no debe tener más de 20 caracteres',
              },
              validate: {
                uppercase: (value) =>
                  /[A-Z]/.test(value) || 'La contraseña debe contener al menos una letra mayúscula',
                lowercase: (value) =>
                  /[a-z]/.test(value) || 'La contraseña debe contener al menos una letra minúscula',
                number: (value) => /[0-9]/.test(value) || 'La contraseña debe contener al menos un número',
                specialChar: (value) =>
                  /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                  'La contraseña debe contener al menos un carácter especial',
            },
          }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                error={Boolean(error)}
                helperText={error?.message}
                inputProps={{
                  maxLength: 20,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  },
                  readOnly: editingUser,
                }}
                required={!editingUser}
                InputProps={{
                  endAdornment: (
                    <button type="button" onClick={togglePasswordVisibility} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                      {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
                    </button>
                  ),
                }}
              />
            )}
          />
        )}

          <Controller
            name="role"
            control={control}
            rules={{ required: 'Debes seleccionar un rol' }}
            render={({ field }) => (
              <FormControl fullWidth error={Boolean(errors.role)}>
                <InputLabel>Rol</InputLabel>
                <Select {...field} label="Rol">
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="viewer">Observador</MenuItem>
                  <MenuItem value="cashier">Cajero</MenuItem>
                </Select>
                {typeof errors.role?.message === 'string' ? (<FormHelperText error>{errors.role.message}</FormHelperText>) : null}
              </FormControl>
            )}
          />
          <Button variant="contained" onClick={handleSubmit(handleFormSubmit)} disabled={!isValid || isPending}>
            {editingUser ? 'Actualizar' : 'Agregar'}
          </Button>
        </Stack>
      </Modal>
      {typeof successMessage === 'string' && (<Typography sx={{ color: 'green' }}>{successMessage}</Typography>)}
      {typeof errorMessage === 'string' && (<Typography sx={{ color: 'red' }}>{errorMessage}</Typography>)}
      <Dialog
        open={Boolean (dialogOpen)}
        onClose={() => {
          setDialogOpen(false);
        }}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar este usuario?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
            }}
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (userToDelete !== null) {
                try {
                  const token = localStorage.getItem('custom-auth-token');
                  const response = await fetch(`${API_URL}/users/${userToDelete}`, {
                    method: 'DELETE',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  });
            
                  if (!response.ok) {
                    showErrorMessage('Error al eliminar el usuario');
                    return;
                  }
            
                  fetchUser();  // Actualiza la lista de usuarios
                  showSnackbar('Usuario eliminado con éxito', 'success');
                } catch (error) {
                  showSnackbar('Error al eliminar el usuario', 'error');
                } finally {
                  setDialogOpen(false);  // Cierra el diálogo
                  setUserToDelete(null);  // Limpia el estado
                }
              }
            }}
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
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

function applyPagination(rows: Customer[], _user: Customer[], page: number, rowsPerPage: number): Customer[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
