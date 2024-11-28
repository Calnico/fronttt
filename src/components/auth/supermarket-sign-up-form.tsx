'use client';

import * as React from 'react';
import { useUser } from '@/hooks/use-user';
import { useRouter} from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Grid, InputAdornment, MenuItem, Select, TextField} from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { authClient } from '@/lib/auth/client';
import { API_URL } from '@/config';
import { paths } from '@/paths';


const schema = zod.object({
  name: zod
    .string()
    .min(1, { message: 'El nombre del supermercado es requerido' })
    .max(255, { message: 'El nombre del supermercado no debe tener más de 255 caracteres' }),
  address: zod.object({
    neighborhood: zod.string()
      .min(1, { message: 'El barrio es requerido' })
      .max(255, { message: 'El barrio no debe tener más de 255 caracteres' }),
    locationType: zod.string()
      .min(1, { message: 'El tipo de ubicación es requerido' }),
    streetNumber: zod.string()
      .min(1, { message: 'El número de la calle es requerido' })
      .max(20, { message: 'El número de la calle no debe tener más de 20 caracteres' }),
    intersectionNumber: zod.string()
      .min(1, { message: 'El número de intersección es requerido' })
      .max(20, { message: 'El número de intersección no debe tener más de 20 caracteres' }),
    buildingNumber: zod.string()
      .min(1, { message: 'El número de edificio es requerido' })
      .max(20, { message: 'El número de edificio no debe tener más de 20 caracteres' }),
    additionalInfo: zod.string()
      .min(1, { message: 'La información adicional es requerida' })
      .max(255, { message: 'La información adicional no debe tener más de 255 caracteres' }),
  }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = {
  name: '',
  address: {
    neighborhood: '',
    locationType: '',
    streetNumber: '',
    intersectionNumber: '',
    buildingNumber: '',
    additionalInfo: '',
  },
} satisfies Values;

export function SupermarketSignUpForm(): React.JSX.Element {
  const router = useRouter();
  const [, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const { checkSession, user } = useUser();
  const [isPending, setIsPending] = React.useState<boolean>(false);

  React.useEffect(() =>{
    if (user?.ownedSupermarket) {
      router.push(paths.dashboard.overview);
    }
  }, [user, router]);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        return;
      }
      await checkSession?.();
      
      router.refresh();
    } catch (error) {
      setErrorMessage('Ocurrió un error al cerrar sesión');
    }
  }, [router, checkSession]);

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isValid },
  } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
  
      const token = localStorage.getItem('custom-auth-token');
      const ownerId = localStorage.getItem('userId'); // Obtener el userId del localStorage
  
      if (!token) {
        setError('root', { type: 'server', message: 'No se encontró el token de autorización' });
        setIsPending(false);
        return;
      }
  
      if (!ownerId) {
        setError('root', { type: 'server', message: 'No se encontró el ID del propietario' });
        setIsPending(false);
        return;
      }
  
      try {
        const response = await fetch(`${API_URL}/supermarket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...values, ownerId: Number(ownerId) }),
        });
  
        interface ErrorResponse {
          message?: string;
        }
  
        if (!response.ok) {
          const errorData: ErrorResponse = await response.json();
          setError('root', { type: 'server', message: errorData.message || `Error ${response.status}` });
          setIsPending(false);
          return;
        }
  
        setSuccessMessage('Supermercado registrado exitosamente.');
        reset();



      // Actualizar la información del usuario
      const userResponse = await fetch(`${API_URL}/users/${ownerId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

        // Define la interfaz para la respuesta de error
        interface ErrorResponse {
          message?: string;
        }

        if (!userResponse.ok) {
          // Espera la respuesta y tipa adecuadamente
          const errorData = await userResponse.json() as ErrorResponse; // Aserción de tipo

          // Verifica si errorData tiene la propiedad message
          const errorMessage = errorData.message || `Error ${userResponse.status}`;
          setError('root', { type: 'server', message: errorMessage });
          setIsPending(false);
          return;
        }
        interface UserData {
          email: string;
          id: string;
          role: string;
        }
        
        interface SuperMarket {
          id: string;
        }
        
        const storedData = localStorage.getItem('user');
        const updatedUserData: Partial<UserData> = storedData ? JSON.parse(storedData) : {};
        
        const storedSuperMarket = localStorage.getItem('superMarket');
        const superMarket: Partial<SuperMarket> = storedSuperMarket ? JSON.parse(storedSuperMarket) : {};
        
        const tokenReload = {
          email: updatedUserData.email || '', // Usar '' si no hay valor
          supermarketId: superMarket.id || '', // Usar '' si no hay valor
          id: updatedUserData.id || '', // Usar '' si no hay valor
          role: updatedUserData.role || '', // Usar '' si no hay valor
        };
      const tokenResponse = await fetch(`${API_URL}/auth/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenReload),
      });
      interface TokenResponse {
        access_token: string;
      }
      const tokenData: TokenResponse = await tokenResponse.json();
      localStorage.setItem('custom-auth-token', tokenData.access_token);
      // Refrescar la sesión para obtener los datos nuevos
      await checkSession?.(); 
      setTimeout(() => {
        router.push(paths.dashboard.overview);
      }, 3000);

    } catch (error) {
      setError('root', { type: 'server', message: 'Error al registrar el supermercado' });
    } finally {
      setIsPending(false);
    }
  },
  [router, reset, setError, checkSession]
);
  


    return (
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Registro de Supermercado</Typography>
        </Stack>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormControl error={Boolean(errors.name)}>
                  <InputLabel>Nombre del supermercado</InputLabel>
                  <OutlinedInput {...field} label="Nombre del supermercado" inputProps={{ maxLength: 255,
                    onInput: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                    }
                   }} />
                  {errors.name ? <FormHelperText>{errors.name.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Typography variant="h6">Dirección</Typography>
            <Controller
              control={control}
              name="address.neighborhood"
              render={({ field }) => (
                <FormControl error={Boolean(errors.address?.neighborhood)}>
                  <InputLabel>Barrio</InputLabel>
                  <OutlinedInput {...field} label="Barrio" inputProps={{ maxLength: 255,
                    onInput: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                    }
                   }} />
                  {errors.address?.neighborhood ? <FormHelperText>{errors.address.neighborhood.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="address.locationType"
              render={({ field }) => (
                <FormControl error={Boolean(errors.address?.locationType)}>
                  <InputLabel>Tipo de ubicación</InputLabel>
                  <Select {...field} label="Tipo de ubicación">
                    <MenuItem value="avenue">Avenida</MenuItem>
                    <MenuItem value="avenue_street">Avenida Calle</MenuItem>
                    <MenuItem value="avenue_road">Avenida Carrera</MenuItem>
                    <MenuItem value="street">Calle</MenuItem>
                    <MenuItem value="road">Carrera</MenuItem>
                    <MenuItem value="circular">Circular</MenuItem>
                    <MenuItem value="circunvalar">Circunvalar</MenuItem>
                    <MenuItem value="diagonal">Diagonal</MenuItem>
                    <MenuItem value="block">Manzana</MenuItem>
                    <MenuItem value="transversal">Transversal</MenuItem>
                    <MenuItem value="way">Vía</MenuItem>
                  </Select>
                  {errors.address?.locationType ? <FormHelperText>{errors.address.locationType.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Controller
                  control={control}
                  name="address.streetNumber"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Número de la calle"
                      inputProps={{ maxLength: 20,
                        onInput: (event) => {
                          const input = event.target as HTMLInputElement;
                          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                        }
                       }}
                      error={Boolean(errors.address?.streetNumber)}
                      helperText={errors.address?.streetNumber?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  control={control}
                  name="address.intersectionNumber"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Número de intersección"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">#</InputAdornment>,
                      }}
                      inputProps={{ maxLength: 20,
                        onInput: (event) => {
                        const input = event.target as HTMLInputElement;
                        input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                      } }}
                      error={Boolean(errors.address?.intersectionNumber)}
                      helperText={errors.address?.intersectionNumber?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  control={control}
                  name="address.buildingNumber"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">-</InputAdornment>,
                      }}
                      inputProps={{ maxLength: 20,
                        onInput: (event) => {
                          const input = event.target as HTMLInputElement;
                          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                        }
                       }}
                      label="Número de edificio"
                      error={Boolean(errors.address?.buildingNumber)}
                      helperText={errors.address?.buildingNumber?.message}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Controller
              control={control}
              name="address.additionalInfo"
              render={({ field }) => (
                <TextField
                  {...field}
                  inputProps={{ maxLength: 255,
                    onInput: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                    }
                   }}
                  label="Información adicional"
                  error={Boolean(errors.address?.additionalInfo)}
                  helperText={errors.address?.additionalInfo?.message}
                  fullWidth
                />
              )}
            />
            {Boolean(successMessage?.trim()) && (
              <Alert severity="success">{successMessage}</Alert>
            )}
            {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
            <Button disabled={!isValid || isPending} type="submit" variant="contained">
              Registrar supermercado
            </Button>
            <Button onClick={handleSignOut} variant="outlined" color="secondary">
              Cerrar sesión
            </Button>
          </Stack>
        </form>
      </Stack>
    );
  }
