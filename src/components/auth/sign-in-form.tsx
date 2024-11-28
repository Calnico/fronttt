'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  email: zod.string()
    .email({ message: 'El correo electrónico es inválido' })
    .min(1, { message: 'El correo electrónico es requerido' }),
  password: zod.string().min(1, { message: 'La contraseña es requerida' }),
});

type Values = zod.infer<typeof schema>;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const { checkSession } = useUser();
  const [showPassword, setShowPassword] = React.useState<boolean>();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  
  const [failedAttempts, setFailedAttempts] = React.useState<number>(0);
  const [isBlocked, setIsBlocked] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [remainingTime, setRemainingTime] = React.useState<number>(0); // Estado para el tiempo restante
  const [visibleError, setVisibleError] = React.useState<boolean>(false); // Controla la visibilidad del error

  React.useEffect(() => {
    const storedAttempts = localStorage.getItem('failedAttempts');
    const blockedUntil = localStorage.getItem('blockedUntil');

    if (storedAttempts) {
      setFailedAttempts(Number(storedAttempts));
    }

    if (blockedUntil) {
      const unblockTime = Number(blockedUntil);
      const currentTime = Date.now();

      if (currentTime < unblockTime) {
        setIsBlocked(true);
        const timeLeft = unblockTime - currentTime;
        setRemainingTime(timeLeft);

        const timer = setInterval(() => {
          const newTimeLeft = unblockTime - Date.now();
          if (newTimeLeft <= 0) {
            clearInterval(timer);
            setIsBlocked(false);
            setRemainingTime(0);
            localStorage.removeItem('blockedUntil');
            localStorage.removeItem('failedAttempts');
          } else {
            setRemainingTime(newTimeLeft);
          }
        }, 1000);

        return () => {clearInterval(timer)};
      }
    }
  }, []);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      if (isBlocked) return;

      setIsPending(true);

      const { error } = await authClient.signInWithPassword(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setVisibleError(true); // Muestra el error

        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        localStorage.setItem('failedAttempts', newFailedAttempts.toString());

        if (newFailedAttempts >= 5) {
          setIsBlocked(true);
          setErrorMessage('Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.');
          setVisibleError(true); // Muestra el mensaje de bloqueo

          const unblockTime = Date.now() + 5 * 60 * 1000;
          localStorage.setItem('blockedUntil', unblockTime.toString());

          setRemainingTime(5 * 60 * 1000);

          const timer = setInterval(() => {
            const newTimeLeft = unblockTime - Date.now();
            if (newTimeLeft <= 0) {
              clearInterval(timer);
              setIsBlocked(false);
              setRemainingTime(0);
              localStorage.removeItem('blockedUntil');
              localStorage.removeItem('failedAttempts');
            } else {
              setRemainingTime(newTimeLeft);
            }
          }, 1000);

          setTimeout(() => {
            setIsBlocked(false);
            setFailedAttempts(0);
            localStorage.removeItem('failedAttempts');
            localStorage.removeItem('blockedUntil');
            setRemainingTime(0);
          }, 5 * 60 * 1000);
        }

        setTimeout(() => {
          setVisibleError(false);
        }, 5000);

        setIsPending(false);
        return;
      }

      setFailedAttempts(0);
      localStorage.removeItem('failedAttempts');
      localStorage.removeItem('blockedUntil');

      // const { data } = await authClient.getUser();


      await checkSession?.();
      router.refresh();
    },
    [checkSession, router, setError, failedAttempts, isBlocked]
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h4">Inicio de Sesión</Typography>
        <Typography color="text.secondary" variant="body2">
          ¿Aún no tienes una cuenta?{' '}
          <Link component={RouterLink} href={paths.auth.signUp} underline="hover" variant="subtitle2">
            Regístrate
          </Link>
        </Typography>
      </Stack>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Correo electrónico</InputLabel>
                <OutlinedInput {...field} label="Correo Electronico" type="email" inputProps={{ maxLength: 255,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                 }}/>
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Contraseña</InputLabel>
                <OutlinedInput
                  {...field}
                  endAdornment={
                    showPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => {setShowPassword(false);}}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => {setShowPassword(true);}}
                      />
                    )
                  }
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  inputProps={{ maxLength: 20,
                    onInput: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                    }
                   }}
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <div>
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          {visibleError && errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          {visibleError && errorMessage?.trim() && (<Alert color="error">{errorMessage}</Alert>)}
          {Boolean(isBlocked) && (
            <Alert severity="warning">
              {`Estás bloqueado. Intenta nuevamente en ${formatTime(remainingTime)}`}
            </Alert>
          )}
          <Button disabled={!isValid || isPending || isBlocked} type="submit" variant="contained">
            Iniciar sesión
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}