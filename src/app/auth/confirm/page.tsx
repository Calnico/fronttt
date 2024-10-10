'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';

import { authClient } from '@/lib/auth/client';
import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';

const ConfirmContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [globalError, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState<boolean>(true);

  React.useEffect(() => {
    // Verificar si el usuario tiene permiso para acceder
    const canAccess = localStorage.getItem('canAccessConfirmation');
    if (!canAccess) {
      router.replace('/auth/sign-in');
      return;
    }

    const confirmAccount = async (): Promise<void> => {
      const tokenStr = Array.isArray(token) ? token[0] : token;

      if (!tokenStr) {
        setError('El token de confirmación no es válido.');
        setIsPending(false);
        return;
      }

      try {
        const { error } = await authClient.confirmAccount({ token: tokenStr });

        if (error) {
          setError(error);
        } else {
          // Limpiar el indicador después de confirmar la cuenta
          localStorage.removeItem('canAccessConfirmation');
          // Redirigir al login después de confirmar exitosamente
          router.push('/auth/sign-in');
        }
      } catch (err) {
        setError('Error en la confirmación de cuenta. Inténtalo de nuevo.');
      } finally {
        setIsPending(false);
      }
    };

    confirmAccount();
  }, [token, router]);

  return (
    <Stack spacing={4}>
      <Typography variant="h5">Confirmando cuenta...</Typography>

      {isPending && <CircularProgress />}
      {globalError && <Alert severity="error">{globalError}</Alert>}
      {!isPending && !globalError && <Typography>Redirigiendo al login...</Typography>}
    </Stack>
  );
};

export default function Page(): React.JSX.Element {
  return (
    <Layout>
      <GuestGuard>
        <React.Suspense fallback={<CircularProgress />}>
          <ConfirmContent />
        </React.Suspense>
      </GuestGuard>
    </Layout>
  );
}
