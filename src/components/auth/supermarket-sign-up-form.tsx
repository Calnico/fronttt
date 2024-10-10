'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Grid, InputAdornment, MenuItem, Select, TextField } from '@mui/material';
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

// Esquema de validación actualizado
const schema = zod.object({
  name: zod.string().min(1, { message: 'El nombre del supermercado es requerido' }).max(255, { message: 'El nombre del supermercado no debe tener más de 255 caracteres' }),
  ownerId: zod.string().min(1, { message: 'El ID del propietario es requerido' }),
  address: zod.string().min(1, { message: 'La dirección es requerida' }),
  neighborhood: zod.string().min(1, { message: 'El barrio es requerido' }),
  locationType: zod.string().min(1, { message: 'El tipo de ubicación es requerido' }),
  streetNumber: zod.string().min(1, { message: 'El número de la calle es requerido' }),
  intersectionNumber: zod.string().min(1, { message: 'El número de intersección es requerido' }), // Requerido
  buildingNumber: zod.string().min(1, { message: 'El número de edificio es requerido' }), // Requerido
  additionalInfo: zod.string().min(1, { message: 'La información adicional es requerida' }), // Requerido
});

type Values = zod.infer<typeof schema>;

// Valores por defecto
const defaultValues = {
  name: '',
  ownerId: '',
  address: '',
  neighborhood: '',
  locationType: '',
  streetNumber: '',
  intersectionNumber: '', // Opcional
  buildingNumber: '', // Opcional
  additionalInfo: '', // Opcional
} satisfies Values;

export function SupermarketSignUpForm(): React.JSX.Element {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.supermarketsignUp(values, values.ownerId);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      router.refresh();
    },
    [router, setError]
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
                <OutlinedInput {...field} label="Nombre del supermercado" />
                {errors.name ? <FormHelperText>{errors.name.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="ownerId"
            render={({ field }) => (
              <FormControl error={Boolean(errors.ownerId)}>
                <InputLabel>ID del propietario</InputLabel>
                <OutlinedInput {...field} label="ID del propietario" />
                {errors.ownerId ? <FormHelperText>{errors.ownerId.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="address"
            render={({ field }) => (
              <FormControl error={Boolean(errors.address)}>
                <InputLabel>Dirección</InputLabel>
                <OutlinedInput {...field} label="Dirección" />
                {errors.address ? <FormHelperText>{errors.address.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="neighborhood"
            render={({ field }) => (
              <FormControl error={Boolean(errors.neighborhood)}>
                <InputLabel>Barrio</InputLabel>
                <OutlinedInput {...field} label="Barrio" />
                {errors.neighborhood ? <FormHelperText>{errors.neighborhood.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="locationType"
            render={({ field }) => (
              <FormControl error={Boolean(errors.locationType)}>
                <InputLabel>Tipo de ubicación</InputLabel>
                <OutlinedInput {...field} label="Tipo de ubicación" />
                {errors.locationType ? <FormHelperText>{errors.locationType.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Controller
                control={control}
                name="streetNumber"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de la calle"
                    error={Boolean(errors.streetNumber)}
                    helperText={errors.streetNumber?.message}
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <Controller
                control={control}
                name="intersectionNumber"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de intersección"
                    error={Boolean(errors.intersectionNumber)}
                    helperText={errors.intersectionNumber?.message}
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <Controller
                control={control}
                name="buildingNumber"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de edificio"
                    error={Boolean(errors.buildingNumber)}
                    helperText={errors.buildingNumber?.message}
                    fullWidth
                  />
                )}
              />
            </Grid>
          </Grid>
          <Controller
            control={control}
            name="additionalInfo"
            render={({ field }) => (
              <TextField
                {...field}
                label="Información adicional"
                error={Boolean(errors.additionalInfo)}
                helperText={errors.additionalInfo?.message}
                fullWidth
              />
            )}
          />
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button disabled={!isValid || isPending} type="submit" variant="contained">
            Registrar supermercado
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

function checkSession(): void {
  throw new Error('Function not implemented.');
}
