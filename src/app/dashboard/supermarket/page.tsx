'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {Card, CardContent, Typography, Alert, Button, TextField, Stack, Box, Divider, CardHeader, IconButton, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { FloppyDisk as FloppyDiskIcon  } from '@phosphor-icons/react/dist/ssr/FloppyDisk';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { Building as BuildingIcon } from '@phosphor-icons/react/dist/ssr/Building';
import { UserFocus as UserFocusIcon } from '@phosphor-icons/react/dist/ssr/UserFocus';
import { Signpost as SignpostIcon } from '@phosphor-icons/react/dist/ssr/Signpost';
import { Gps as GpsIcon } from '@phosphor-icons/react/dist/ssr/Gps';
import { Info as InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { API_URL } from '@/config';
import { useRouter } from 'next/navigation';


const Container = styled('div')(({ theme }) => ({
display: 'flex',
justifyContent: 'center',
padding: theme.spacing(4),
backgroundColor: 'transparent',
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
marginBottom: theme.spacing(3),
'& .MuiOutlinedInput-root': {
  borderRadius: theme.shape.borderRadius * 2,
},
}));

const StyledCard = styled(Card)(({ theme }) => ({
maxWidth: 800,
width: '100%',
boxShadow: theme.shadows[5],
padding: theme.spacing(3),
marginTop: theme.spacing(-2),
borderRadius: theme.shape.borderRadius * 2,
backgroundColor: '#f9f9f9',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
fontWeight: '600',
color: 'black',
marginBottom: theme.spacing(1),
fontSize: '1.5rem',
paddingBottom: theme.spacing(1),
}));

interface Address {
neighborhood?: string;
locationType?: string;
streetNumber?: string;
buildingNumber?: string;
additionalInfo?: string;
intersectionNumber?: string;
}

interface Supermarket {
id: number;
name: string;
owner: { id: number };
address: Address;
}

interface StoredUser {
ownedSupermarket?: { id: string };
supermarket?: { id: string };
role?: string;
}

function SupermarketDetails(): React.JSX.Element {
const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
const [loading , setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState<Supermarket | null>(null);
const [userRole, setUserRole] = useState<string | null>(null);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
const [deleteSuccess, setDeleteSuccess] = useState(false);
const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success'); // Tipo de alerta
const [dialogOpen, setDialogOpen] = useState(false);
const maxRetries = 3;

const router = useRouter();
// Verificar si el usuario tiene uno de los roles permitidos
useEffect(() => {
const storedUser: StoredUser = JSON.parse(localStorage.getItem('user') || '{}');
const role = storedUser.role;

// Redirige si el rol no está en la lista permitida
if (!['owner', 'admin', 'viewer'].includes(role || '')) {
  router.replace('errors/not-found'); // Reemplaza con la página de acceso restringido
} else {
  setUserRole(role ?? null); // Asigna directamente sin una variable extra
}
}, [router]);

const fetchSupermarketDetails = async (supermarketId: string): Promise<Supermarket> => {
    const token = localStorage.getItem('custom-auth-token');
    const url = `${API_URL}/supermarket/${supermarketId}`;
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

    return (await response.json()) as Supermarket;
};    

const updateSupermarketDetails = async (): Promise<void> => {
    const token = localStorage.getItem('custom-auth-token');
    const supermarketId = supermarket?.id;

    if (!supermarketId) {
        setError("ID del supermercado no disponible. No se puede actualizar el supermercado.");
        return;
    }

    const url = `${API_URL}/supermarket/${supermarketId}`;

    const dataToUpdate = {
        name: formData?.name,
        ownerId: supermarket.owner.id,
        address: formData?.address,
    };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToUpdate),
        });

        if (!response.ok) {
            const errorDetail = await response.text();
            throw new Error(`Error al actualizar los datos: ${errorDetail}`);
        }

        const updatedData = (await response.json()) as Supermarket;
        setSupermarket(updatedData);
        setIsEditing(false);
        setFormData(updatedData);
        setSnackbarMessage('Información del supermercado actualizada exitosamente');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setDialogOpen(false);
    } catch (updateError: unknown) {
        setSnackbarMessage('Error al actualizar el supermercado. Intente de nuevo.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
};

    const handleDeleteClick = () => {
        setDialogOpen(true);
    };
    
    const deleteSupermarket = async () => {
        const token = localStorage.getItem('custom-auth-token');
        const supermarketId = supermarket?.id;
    
        if (!supermarketId) {
            setError("ID del supermercado no disponible. No se puede eliminar.");
            return;
        }
    
        const url = `${API_URL}/supermarket/${supermarketId}`;
    
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        
            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`Error al eliminar el supermercado: ${errorDetail}`);
            }
        
            // Mostrar Snackbar de éxito
            setDeleteSuccess(true);
            setSnackbarMessage('Supermercado eliminado exitosamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        
            
            window.location.href = '/auth/supermarket-sign-up';
        
        } catch (deleteError: unknown) {
            setDeleteSuccess(false);
            setSnackbarMessage('Error al eliminar el supermercado. Intente nuevamente.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setDialogOpen(false); // Cerrar el diálogo después de eliminar
        }
    };    
    
    useEffect(() => {
        const fetchData = async () => {
            let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
              const storedUser: StoredUser = JSON.parse(localStorage.getItem('user') || '{}');
              const supermarketId = storedUser.ownedSupermarket?.id || storedUser.supermarket?.id;
          
              if (!supermarketId) {
                throw new Error('Supermarket ID no encontrado');
              }
          
              const supermarketDetails: Supermarket = await fetchSupermarketDetails(supermarketId);
              setSupermarket(supermarketDetails);
              setFormData({
                ...supermarketDetails,
              });
              setUserRole(storedUser.role || null);
              break;
            } catch (loadError: unknown) {
                retryCount += 1;
                if (retryCount >= maxRetries) {
                    if (loadError instanceof Error) {
                        setError(`Error al cargar los datos del supermercado después de varios intentos: ${loadError.message}`);
                    } else {
                        setError("Error desconocido al cargar los datos del supermercado.");
                    }
                    setSupermarket(null);
                    break;
                }
            } finally {
                setLoading(false);
            }
        }
    };

    fetchData();
}, []);

const handleEditClick = (): void => {
    setIsEditing(true);
    setFormData(supermarket);
};

const handleCancelClick = (): void => {
    setIsEditing(false);
    setFormData(supermarket);
};

    // Definir las claves válidas de Address
    const addressKeys: (keyof Address)[] = [
        'neighborhood',
        'locationType',
        'streetNumber',
        'intersectionNumber',
        'buildingNumber',
        'additionalInfo'
    ];

    const validInputPattern = /^[a-zA-Z0-9\s]*$/;


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = event.target;
    
        const validNamePattern = /^[a-zA-Z0-9\s]*$/;
    
        if (name !== 'locationType' && name !== 'name' && !validInputPattern.test(value)) {
            return; 
        }
    
        if ((name === 'locationType' || name === 'name') || value.length <= 10) {
            if (name === 'name') {
                if (!validNamePattern.test(value) || value.length > 30) {
                    return; 
                }
                setFormData(prevData => ({
                    ...prevData!,
                    name: value
                }));
            } else if (addressKeys.includes(name as keyof Address)) {
                setFormData(prevData => ({
                    ...prevData!,
                    address: {
                        ...prevData?.address,
                        [name as keyof Address]: value
                    }
                }));
            }
        }
    };
    
const translateLocationType = (locationType: string | undefined): string => {
  const translations: Record<string, string> = {
      "avenue": "Avenida",
      "avenue_street": "Avenida Calle",
      "avenue_road": "Avenida Carrera",
      "street": "Calle",
      "road": "Carrera",
      "circular": "Circular",
      "circunvalar": "Circunvalar",
      "diagonal": "Diagonal",
      "block": "Manzana",
      "transversal": "Transversal",
      "way": "Vía"
  };
  return translations[locationType || ""] || locationType || "";
};

    return (
        <Container>
                <StyledCard>
                    <CardHeader title={supermarket?.name} />
                    <Divider />
                    <CardContent>
                        {error && <Alert severity="error">{error}</Alert>}
                        {supermarket && (
                            <>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    <strong>Dirección:</strong>
                                </Typography>
                                <Stack spacing={2}>
                                    <Box sx={{ border: '1px solid', borderRadius: 1, p: 2 }}>
                                        <Typography variant="body2"><strong>Barrio:</strong> {supermarket.address.neighborhood}</Typography>
                                    </Box>
                                    <Box sx={{ border: '1px solid', borderRadius: 1, p: 2 }}>
                                        <Typography variant="body2"><strong>Tipo de ubicación:</strong> {translateLocationType(supermarket.address.locationType)}</Typography>
                                    </Box>
                                    <Box sx={{ border: '1px solid', borderRadius: 1, p: 2 }}>
                                        <Typography variant="body2"><strong>Número de calle:</strong> {supermarket.address.streetNumber}</Typography>
                                    </Box>
                                    <Box sx={{ border: '1px solid', borderRadius: 1, p: 2 }}>
                                        <Typography variant="body2"><strong>Número de intersección:</strong> {supermarket.address.intersectionNumber}</Typography>
                                    </Box>
                                    <Box sx={{ border: '1px solid', borderRadius: 1, p: 2 }}>
                                        <Typography variant="body2"><strong>Número de edificio:</strong> {supermarket.address.buildingNumber}</Typography>
                                    </Box>
                                    <Box sx={{ border: '1px solid', borderRadius: 1, p: 2 }}>
                                        <Typography variant="body2"><strong>Información adicional:</strong> {supermarket.address.additionalInfo}</Typography>
                                    </Box>
                                </Stack>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                {(userRole && (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'owner')) && (
                                    <Button
                                        startIcon={<PencilIcon />}
                                        color="primary"
                                        size="small"
                                        onClick={handleEditClick}
                                        sx={{
                                            fontSize: '0.875rem',
                                            padding: '4px 8px',
                                            textTransform: 'none'
                                        }}
                                    >
                                        Editar
                                    </Button>
                                )}                                    
                                    {(userRole !== 'admin' && userRole !== 'viewer') && (
                                        <Button
                                            startIcon={<TrashIcon />}
                                            color="error"
                                            size="small"
                                            onClick={handleDeleteClick}
                                            sx={{
                                                fontSize: '0.875rem',
                                                padding: '4px 8px',
                                                textTransform: 'none'
                                            }}
                                        >
                                            Eliminar
                                        </Button>
                                    )}
                                </Box>
                                <Divider sx={{ my: 3 }} />
                            </>
                        )}
                        {isEditing && formData && (
                            <>
                                <SectionTitle variant="h5">Editar Supermercado</SectionTitle>
                                <CustomTextField
                                    label="Nombre"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    fullWidth
                                    InputProps={{onInput: (event) => {
                                      const input = event.target as HTMLInputElement;
                                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                                    },
                                    startAdornment: <IconButton><UserFocusIcon /></IconButton>}}
                                />
                                <SectionTitle variant="h6">Dirección</SectionTitle>
                                <Stack spacing={2}>
                                    <CustomTextField
                                        label="Barrio"
                                        name="neighborhood"
                                        value={formData.address?.neighborhood || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        InputProps={{onInput: (event) => {
                                          const input = event.target as HTMLInputElement;
                                          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                                        },
                                          startAdornment: <IconButton><GpsIcon  /></IconButton>}}
                                    />
                                    <FormControl fullWidth>
                                    <InputLabel>Tipo de ubicación</InputLabel>
                                    <Select
                                        label="Tipo de ubicación"
                                        name="locationType"
                                        value={formData.address?.locationType || ''}
                                        onChange={(event) => {handleInputChange(event as React.ChangeEvent<HTMLInputElement>)}}  // Cambié el tipo de evento aquí
                                    >
                                         {['avenue', 'avenue_street', 'avenue_road', 'street', 'road', 'circunvalar', 'diagonal', 'block', 'transversal', 'way'].map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {translateLocationType(type)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    </FormControl>
                                    <CustomTextField
                                        label="Número de calle"
                                        name="streetNumber"
                                        value={formData.address?.streetNumber || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        InputProps={{onInput: (event) => {
                                          const input = event.target as HTMLInputElement;
                                          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                                        },
                                          startAdornment: <IconButton><SignpostIcon /></IconButton>}}
                                    />
                                    <CustomTextField
                                        label="Número de intersección"
                                        name="intersectionNumber"
                                        value={formData.address?.intersectionNumber || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        InputProps={{onInput: (event) => {
                                          const input = event.target as HTMLInputElement;
                                          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                                        },
                                        startAdornment: <IconButton><SignpostIcon /></IconButton>}}
                                    />
                                    <CustomTextField
                                        label="Número de edificio"
                                        name="buildingNumber"
                                        value={formData.address?.buildingNumber || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        InputProps={{onInput: (event) => {
                                          const input = event.target as HTMLInputElement;
                                          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                                        },
                                        startAdornment: <IconButton><BuildingIcon /></IconButton>}}
                                    />
                                    <CustomTextField
                                        label="Información adicional"
                                        name="additionalInfo"
                                        value={formData.address?.additionalInfo || ''}
                                        onChange={handleInputChange}
                                        fullWidth
                                        InputProps={{
                                            onInput: (event) => {
                                            const input = event.target as HTMLInputElement;
                                            // Eliminar emojis
                                            input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                                            
                                            // Limitar caracteres (ejemplo: 200 caracteres)
                                            const maxLength = 200;
                                            if (input.value.length > maxLength) {
                                                input.value = input.value.substring(0, maxLength);
                                            }
                                            // Crear un objeto de evento compatible con el tipo ChangeEvent<HTMLInputElement>
                                            const syntheticEvent = {
                                                target: {
                                                name: 'additionalInfo',
                                                value: input.value,
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>;
                                            // Llamar a handleInputChange con el evento compatible
                                            handleInputChange(syntheticEvent);
                                            },
                                            startAdornment: <IconButton><InfoIcon /></IconButton>,
                                        }}
                                    />
                                </Stack>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    startIcon={<FloppyDiskIcon />}
                                    color="primary"
                                    onClick={updateSupermarketDetails}
                                    size="small"
                                    sx={{
                                        fontSize: '0.875rem',
                                        padding: '4px 8px',
                                        textTransform: 'none',
                                        ml: 1
                                    }}
                                >
                                    Guardar
                                </Button>
                                <Button
                                    startIcon={<XIcon />}
                                    color="error"
                                    onClick={handleCancelClick}
                                    size="small"
                                    sx={{
                                        fontSize: '0.875rem',
                                        padding: '4px 8px',
                                        textTransform: 'none',
                                        ml: 1
                                    }}
                                >
                                    Cancelar
                                </Button>
                              </Box>
                            </>
                        )}
                    </CardContent>
                </StyledCard>
            <Dialog
                open={dialogOpen}
                onClose={() => {setDialogOpen(false)}}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro de que deseas eliminar este supermercado?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {setDialogOpen(false)}} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={deleteSupermarket} color="error">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => {setSnackbarOpen(false)}}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => {setSnackbarOpen(false)}} severity={deleteSuccess ? 'success' : 'error'}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => {setSnackbarOpen(false)}}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => {setSnackbarOpen(false)}}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default SupermarketDetails;