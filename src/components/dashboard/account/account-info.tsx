'use client'

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { authClient } from '@/lib/auth/client';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useUser } from '@/hooks/use-user';

export function AccountInfo(): React.JSX.Element {
  const { user } = useUser();
  const [profileImage, setprofileImage] = React.useState<File | null>(null);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);
  const [alertType, setAlertType] = React.useState<'success' | 'error'>('success');
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);    
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string>(
    typeof user?.profileImage === 'string'
      ? user.profileImage
      : localStorage.getItem('avatarUrl') || '/assets/default-avatar.png'
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] || null;
    setprofileImage(file);

    // Mostrar vista previa de la imagen seleccionada
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const handleButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (): Promise<boolean> => {
    if (!profileImage) {
      setAlertMessage('Por favor, selecciona una imagen.');
      setAlertType('error');
      setIsAlertOpen(true);
      return false;
    }
  
    const token = localStorage.getItem('custom-auth-token') as string;
  
    if (!user?.id) {
      setAlertMessage('No se pudo obtener el ID del usuario.');
      setAlertType('error');
      setIsAlertOpen(true);
      return false;
    }
  
    const { error } = await authClient.uploadImage({ profileImage, token, userId: String(user.id) });
  
    if (error) {
      setAlertMessage(error);
      setAlertType('error');
      return false;
    }
    
    setAlertMessage('Imagen subida exitosamente');
    setAlertType('success');
    setprofileImage(null); // Limpiar la imagen seleccionada
    
    // Guardar la imagen subida en localStorage
    localStorage.setItem('avatarUrl', avatarUrl);
    return true;
  };  

  const handleCloseAlert = (): void => {
    setIsAlertOpen(false);
    setAlertMessage(null);
  };

  const roleTranslations: Record<string, string> = {
    admin: 'Administrador',
    viewer: 'Observador',
    cashier: 'Cajero',
    owner: 'Propietario'
  };
  
  const translateRole = (role: string): string => { return roleTranslations[role] || role; };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar src={avatarUrl} sx={{ height: '80px', width: '80px' }} />
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5"> {user?.firstName} {user?.lastName} </Typography>
            <Typography color="text.secondary" variant="body2"> {translateRole(user?.role ?? "")} </Typography>
          </Stack>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleImageChange} 
          />
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button fullWidth variant="text" onClick={handleButtonClick}>
          Seleccionar imagen
        </Button>
        <Button
          fullWidth
          variant="text"
          onClick={async () => {
            const isUploaded = await handleImageUpload();
            if (isUploaded) {
              window.location.reload(); // Recargar la página después de subir la imagen
            }
          }}
        >
          Subir imagen
        </Button>
      </CardActions>
      <Snackbar open={isAlertOpen} autoHideDuration={3000} onClose={handleCloseAlert} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseAlert} severity={alertType} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
}