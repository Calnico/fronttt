'use client';

import * as React from 'react';
import RouterLink from 'next/link';
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
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const schema = zod.object({
  firstName: zod.string()
    .min(1, { message: 'El primer nombre es requerido' })
    .max(50, { message: 'El primer nombre no debe tener más de 50 caracteres' }),
  middleName: zod.string()
    .max(50,{ message: 'El segundo nombre no debe tener más de 50 caracteres' })
    .optional(),
  lastName: zod.string()
    .min(1, { message: 'El primer apellido requerido' })
    .max(50, { message: 'El primer apellido no debe tener más de 50 caracteres' }),
  secondlastName: zod.string()
    .max(50,{ message: 'El segundo apellido no debe tener más de 50 caracteres' })
    .optional(),
  email: zod.string()
    .email({ message: 'El correo electrónico es inválido' })
    .min(1, { message: 'El correo electrónico es requerido' })
    .max(255, { message: 'El correo electrónico no debe tener más de 255 caracteres' }),
  phone: zod.string()
    .min(10, { message: 'El número de celular debe tener al menos 10 caracteres' }),
  password: zod.string()
    .min(9, { message: 'La contraseña debe tener al menos 9 caracteres' })
    .max(20, { message: 'La contraseña no debe tener más de 20 caracteres' })
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula' })
    .regex(/[a-z]/, { message: 'La contraseña debe contener al menos una letra minúscula' })
    .regex(/\d/, { message: 'La contraseña debe contener al menos un número' })
    .regex(/[\W_]/, { message: 'La contraseña debe contener al menos un carácter especial' }),
  role: zod.string(),
  confirmPassword: zod.string()
    .min(9, { message: 'La confirmación de contraseña debe tener al menos 9 caracteres' })
    .max(20, { message: 'La confirmación de contraseña no debe tener más de 20 caracteres' })
    .regex(/[A-Z]/, { message: 'La confirmación de contraseña debe contener al menos una letra mayúscula' })
    .regex(/[a-z]/, { message: 'La confirmación de contraseña debe contener al menos una letra minúscula' })
    .regex(/\d/, { message: 'La confirmación de contraseña debe contener al menos un número' })
    .regex(/[\W_]/, { message: 'La confirmación de contraseña debe contener al menos un carácter especial' }),
  terms: zod.boolean().refine((value) => value, 'Tienes que aceptar los términos y condiciones'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas deben coincidir',
  path: ['confirmPassword'],
});

type Values = zod.infer<typeof schema>;

const defaultValues = { firstName: '', middleName: '', lastName: '', secondlastName: '', phone: '', email: '', password: '', confirmPassword: '', role: 'owner', terms: false } satisfies Values;


export function SignUpForm(): React.JSX.Element {

  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>();
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null); // Estado para el mensaje de éxito
  const [openTerms, setOpenTerms] = React.useState<boolean>(false); // Estado para el diálogo de términos y condiciones
  const [isTermsChecked, setIsTermsChecked] = React.useState<boolean>(false); 
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
    reset,
  } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = React.useCallback(
    
    async (values: Values): Promise<void> => {
      setIsPending(true);
      setSuccessMessage(null);
      const { error, message } = await authClient.signUp({ ...values, phoneNumber: values.phone });

      if (error) {
        setError('root', { type: 'server', message: error });
        setSuccessMessage(null);
      } else if (message) {
        localStorage.setItem('canAccessConfirmation', 'true');
        setSuccessMessage('Registro exitoso, confirma tu correo electrónico');
        reset();
        setIsTermsChecked(false);
}
      setIsPending(false);
    },
    [setError, reset]
  );

  const handleOpenTerms = (): void => {
    setOpenTerms(true);
  };

  const handleCloseTerms = (): void => {
    setOpenTerms(false);
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Registro de Usuario</Typography>
        <Typography color="text.secondary" variant="body2">
          ¿Ya tienes una cuenta?{' '}
          <Link component={RouterLink} href={paths.auth.signIn} underline="hover" variant="subtitle2">
            Inicia sesión
          </Link>
        </Typography>
      </Stack>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
        <Controller
  control={control}
  name="firstName"
  render={({ field }) => (
    <FormControl error={Boolean(errors.firstName)} required>
      <InputLabel required>Primer nombre</InputLabel>
      <OutlinedInput {...field} label="Primer Nombre" inputProps={{ maxLength: 50,
        onInput: (event) => {
          const input = event.target as HTMLInputElement;
          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
        }
       }}/>
      {errors.firstName ? <FormHelperText>{errors.firstName.message}</FormHelperText> : null}
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="middleName"
  render={({ field }) => (
    <FormControl>
      <InputLabel>Segundo nombre</InputLabel>
      <OutlinedInput {...field} label="Segundo Nombre" inputProps={{ maxLength: 50,
        onInput: (event) => {
          const input = event.target as HTMLInputElement;
          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
        }
       }} />
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="lastName"
  render={({ field }) => (
    <FormControl error={Boolean(errors.lastName)} required>
      <InputLabel required>Primer apellido</InputLabel>
      <OutlinedInput {...field} label="Primer Apellido" inputProps={{ maxLength: 50,
        onInput: (event) => {
          const input = event.target as HTMLInputElement;
          input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
        }
       }} />
      {errors.lastName ? <FormHelperText>{errors.lastName.message}</FormHelperText> : null}
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="secondlastName"
  render={({ field }) => (
    <FormControl>
      <InputLabel>Segundo apellido</InputLabel>
      <OutlinedInput {...field} label="Segundo Apellido" inputProps={{ maxLength: 50,
      onInput: (event) => {
            const input = event.target as HTMLInputElement;
            input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
          } }} />
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="email"
  render={({ field }) => (
    <FormControl error={Boolean(errors.email)} required>
      <InputLabel required>Correo electrónico</InputLabel>
      <OutlinedInput {...field} label="Correo Electronico" type="email" inputProps={{ maxLength: 255,
       onInput: (event) => {
            const input = event.target as HTMLInputElement;
            input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
          } }} />
      {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="phone"
  render={({ field }) => (
    <FormControl error={Boolean(errors.phone)} required>
      <InputLabel required>Número de celular</InputLabel>
      <OutlinedInput
        {...field}
        label="Numero de Celular"
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
      />
      {errors.phone ? <FormHelperText>{errors.phone.message}</FormHelperText> : null}
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="password"
  render={({ field }) => (
    <FormControl error={Boolean(errors.password)} required>
      <InputLabel required>Contraseña </InputLabel>
      <OutlinedInput
        {...field}
        endAdornment={showPassword ? (
          <EyeIcon
            cursor="pointer"
            fontSize="var(--icon-fontSize-md)"
            onClick={(): void => { setShowPassword(false); }}
          />
        ) : (
          <EyeSlashIcon
            cursor="pointer"
            fontSize="var(--icon-fontSize-md)"
            onClick={(): void => { setShowPassword(true); }}
          />
        )}
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
<Controller
  control={control}
  name="confirmPassword"
  render={({ field }) => (
    <FormControl error={Boolean(errors.confirmPassword)} required>
      <InputLabel required>Confirmar contraseña</InputLabel>
      <OutlinedInput
        {...field}
        endAdornment={showConfirmPassword ? (
          <EyeIcon
            cursor="pointer"
            fontSize="var(--icon-fontSize-md)"
            onClick={(): void => { setShowConfirmPassword(false); }}
          />
        ) : (
          <EyeSlashIcon
            cursor="pointer"
            fontSize="var(--icon-fontSize-md)"
            onClick={(): void => { setShowConfirmPassword(true); }}
          />
        )}
        label="Confirmar contraseña"
        type={showConfirmPassword ? 'text' : 'password'}
        inputProps={{ maxLength: 20,
                    onInput: (event) => {
            const input = event.target as HTMLInputElement;
            input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
          }
         }}
      />
      {errors.confirmPassword ? <FormHelperText>{errors.confirmPassword.message}</FormHelperText> : null}
    </FormControl>
  )}
/>
<Controller
  control={control}
  name="terms"
  render={({ field: inputfield }) => (
    <FormControl error={Boolean(errors.terms)}>
      <FormControlLabel
        control={
          <Checkbox
            {...inputfield}
            checked={isTermsChecked}
            onChange={(event) => {
              inputfield.onChange(event); // Ejecuta el onChange de Controller
              setIsTermsChecked(event.target.checked); // Actualiza el estado local
            }}
          />
        }
        label={
          <span
            style={{ cursor: 'default' }}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Lógica para activar el click con Enter o espacio
              }
            }}
          >
            He leído los{' '}
            <Link
              onClick={(event) => {
                event.preventDefault();
                handleOpenTerms();
              }}
              style={{ cursor: 'pointer' }}
            >
              términos y condiciones
            </Link>
          </span>
        }
      />
      {errors.terms ? <FormHelperText>{errors.terms.message}</FormHelperText> : null}
    </FormControl>
  )}
/>
        {Boolean(successMessage?.trim()) && ( // Asegúrate de que esto se renderiza
        <Alert severity="success">{successMessage}</Alert> // Mensaje de éxito
      )}

          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button disabled={!isValid || isPending || !isTermsChecked} type="submit" variant="contained">
            Regístrate
          </Button>
        </Stack>
      </form>
            <Dialog open={openTerms} onClose={handleCloseTerms} maxWidth="md" fullWidth>
        <DialogTitle>Términos y Condiciones</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Sistema de Gestión de Inventario Alimenticio con Visión Artificial y Notificación de Caducidad en Cárnicos
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Fecha de actualización: [DD/MM/YY]
          </Typography>
          <Typography variant="body2" gutterBottom>
            El acceso y uso del Sistema de Gestión de Inventario Alimenticio, en adelante el Sistema, implica la aceptación plena de estos Términos y Condiciones por parte del usuario. Si no está de acuerdo con los mismos, no debe utilizar el Sistema.
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            1. Autorizaciones
          </Typography>
          <Typography variant="body2" gutterBottom>
            Al utilizar el Sistema, el usuario autoriza al operador del sistema para procesar y almacenar los datos relacionados con el inventario y las notificaciones de caducidad. Esta autorización incluye el uso de tecnologías de visión artificial para la detección de productos, el monitoreo de fechas de caducidad, y la emisión de alertas automáticas.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            2. Responsabilidad
          </Typography>
          <Typography variant="body2" gutterBottom>
            El Sistema es una herramienta de apoyo en la gestión del inventario alimenticio, diseñada para optimizar la operación y minimizar el desperdicio mediante la notificación oportuna de productos a punto de caducar...
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            3. Restricciones
          </Typography>
          <Typography variant="body2" gutterBottom>
            El usuario no podrá:

              - Acceder o intentar acceder a áreas del Sistema a las que no tiene autorización.
              - Manipular o alterar el código fuente o cualquier funcionalidad del Sistema.
              - Utilizar el Sistema para actividades fraudulentas o ilícitas.
              - Revender, sublicenciar o redistribuir el Sistema sin la autorización previa y por escrito del operador del sistema.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            4. Derechos de Autor
          </Typography>
          <Typography variant="body2" gutterBottom>
            El Sistema y todos sus componentes, incluyendo software, diseño, logotipos y textos, son propiedad exclusiva del operador del Sistema y están protegidos por las leyes de derechos de autor vigentes. No se permite la reproducción, distribución, modificación o cualquier otro uso no autorizado del Sistema sin el consentimiento explícito del propietario.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            5. Marcas y Propiedad Intelectual
          </Typography>
          <Typography variant="body2" gutterBottom>
            Las marcas, logotipos y nombres comerciales utilizados en el Sistema son propiedad del operador o de terceros que han autorizado su uso. El uso no autorizado de estos elementos constituye una violación de las leyes de propiedad intelectual.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            6. Enlaces a Sitios de Terceros
          </Typography>
          <Typography variant="body2" gutterBottom>
            El Sistema puede contener enlaces a sitios web de terceros. Estos enlaces se proporcionan solo para la conveniencia del usuario. El operador del Sistema no asume ninguna responsabilidad sobre el contenido, servicios o productos ofrecidos en dichos sitios externos.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            7. Condiciones de Uso del Sistema
          </Typography>
          <Typography variant="body2" gutterBottom>
            El operador del Sistema se reserva el derecho a modificar, suspender o interrumpir cualquier función del Sistema en cualquier momento y sin previo aviso. Además, se puede denegar el acceso al Sistema a cualquier usuario que viole estos Términos y Condiciones.

            El usuario es responsable de la confidencialidad de sus credenciales de acceso y de todas las acciones realizadas bajo su cuenta.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            8. Autorización de Uso de Datos de Registro
          </Typography>
          <Typography variant="body2" gutterBottom>
            El usuario acepta que los datos personales proporcionados durante el registro, o cualquier otra información relevante, serán utilizados para la operación del Sistema. Esto incluye, pero no se limita a, la identificación de productos, el seguimiento de inventario, y la generación de alertas de caducidad.

            Los datos recolectados podrán ser compartidos con terceros únicamente en cumplimiento de obligaciones legales o con fines operativos, tales como mejorar el rendimiento del Sistema.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            8.1. Texto de Autorización
          </Typography>
          <Typography variant="body2" gutterBottom>
            De acuerdo con las normativas vigentes sobre protección de datos, el usuario autoriza al operador del Sistema a recolectar, almacenar, y tratar sus datos personales para los fines mencionados, y para la mejora de los servicios. El usuario podrá revocar esta autorización en cualquier momento, lo cual puede afectar la funcionalidad del Sistema.
          </Typography>

          <Typography variant="subtitle1" gutterBottom>
            9. Terminación
          </Typography>
          <Typography variant="body2" gutterBottom>
            El operador del Sistema se reserva el derecho de terminar o suspender el acceso de cualquier usuario que incumpla estos Términos y Condiciones o que haga un uso indebido del Sistema. Si tiene preguntas o comentarios sobre estos Términos y Condiciones, puede contactarnos a través de [correo electrónico o teléfono de contacto].
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTerms} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
