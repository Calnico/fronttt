'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth/client';

const schema = zod.object({ email: zod.string()
  .email({ message: 'El correo electrónico es inválido' })
  .min(1, { message: 'El correo electrónico es requerido' })
  .max(255, { message: 'El correo electrónico no debe tener más de 255 caracteres' }), 
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '' } satisfies Values;

export function ResetPasswordForm(): React.JSX.Element {
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isValid},
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema),mode: 'onChange'});

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.resetPassword(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }
      setSuccessMessage('Enlace de confirmación enviado exitosamente, por favor revisa tu correo electrónico');
      
      reset();

      setIsPending(false);

      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 3000);
    },
    [setError, reset, router]
  );

  return (
    <Stack spacing={4}>
      <Typography variant="h4">Reestablecer contraseña</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Correo electrónico</InputLabel>
                <OutlinedInput {...field} label="Correo electronico" type="email" inputProps={{ maxLength: 255,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                 }} />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          {successMessage ? <Alert color="success">{successMessage}</Alert> : null}
          <Button disabled={!isValid || isPending} type="submit" variant="contained">
            Enviar enlace de recuperación
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
