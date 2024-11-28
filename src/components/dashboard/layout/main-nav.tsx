'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
// import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
// import Button from '@mui/material/Button';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
// import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { usePopover } from '@/hooks/use-popover';
import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';
import type { NotificationsParams } from '@/lib/auth/client';
import type { User } from '@/types/user';
import { API_URL } from '@/config';
import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';


export function MainNav(): React.JSX.Element {
  const [notifications, setNotifications] = React.useState<NotificationsParams[]>([]);
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const userPopover = usePopover<HTMLDivElement>();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const user: User = JSON.parse(localStorage.getItem('user') || '{}');
  const [avatarUrl] = React.useState<string>(
    typeof user?.profileImage === 'string'
      ? user.profileImage
      : localStorage.getItem('avatarUrl') || '/assets/default-avatar.png'
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [seenNotifications, setSeenNotifications] = React.useState<Set<number>>(new Set());

  useEffect(() => {
    const storedUser: User = JSON.parse(localStorage.getItem('user') || '{}');
    const role = storedUser.role;
    if (!['owner', 'admin', 'cashier', 'viewer'].includes(role || '')) {
      router.replace('errors/not-found');
    } else {
      setUserRole(role ?? null);
    }
  }, [router]);

  // useEffect(() => {
  //   const intervalId = setInterval(async () => {
  //     try {
  //       const userInterval: User = JSON.parse(localStorage.getItem('user') || '{}');
  //       const supermarketId = userInterval.supermarket?.id || userInterval.ownedSupermarket?.id;
  //       const token = localStorage.getItem('custom-auth-token');
  //       const response = await fetch(`${API_URL}/notifications/supermarket/${supermarketId}`, {
  //         method: 'GET',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });
  
  //       if (response.ok) {
  //         const data: NotificationsParams[] = await response.json();
  //         setNotifications(data);
  //         setUnreadCount(data.length); // Recalcula el número de notificaciones no vistas.
  //       }
  //     } catch (error) {
  //       console.error('Error fetching notifications:', error);
  //     }
  //   }, 15000); // Cada 15 segundos.
  
  //   return () => clearInterval(intervalId);
  // }, []);
  

  const showSnackbar = (message: string, severity: 'success' | 'error'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  React.useEffect(() => {
    const fetchNotifications = async (): Promise<void> => {
      try {
        const userMain: User = JSON.parse(localStorage.getItem('user') || '{}');
        const supermarketId = userMain.supermarket?.id || userMain.ownedSupermarket?.id;
        const token = localStorage.getItem('custom-auth-token');
        const response = await fetch(`${API_URL}/notifications/supermarket/${supermarketId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data: NotificationsParams[] = await response.json();
          setNotifications(data);
          setUnreadCount(data.length); // Inicializa el contador con el número de notificaciones.
        } else {
          showSnackbar('Error al obtener notificaciones', 'error');
        }
      } catch (error) {
        showSnackbar('Error al obtener notificaciones', 'error');
      }
    };
  
    fetchNotifications();
  }, []);

  const handleNotificationClick = (predictionId: number): void => {
    // Marcamos la notificación como vista
    const updatedSeenNotifications = new Set([...Array.from(seenNotifications), predictionId]);
    setSeenNotifications(updatedSeenNotifications);
    
    // Restamos 1 al contador de notificaciones no vistas
    const newUnreadCount = unreadCount > 0 ? unreadCount - 1 : 0;
    setUnreadCount(newUnreadCount);
  
    // Guardamos en localStorage
    localStorage.setItem('seenNotifications', JSON.stringify(Array.from(updatedSeenNotifications)));
    localStorage.setItem('unreadCount', String(newUnreadCount));
  
    // Redirigimos al detalle de la predicción
    router.replace(`/dashboard/predictions?predictionId=${predictionId}`);
  };
  
  useEffect(() => {
    const storedSeenNotifications = localStorage.getItem('seenNotifications');
    if (storedSeenNotifications) {
      const parsedNotifications = JSON.parse(storedSeenNotifications);
      // Validamos que el valor sea un array de números
      if (Array.isArray(parsedNotifications) && parsedNotifications.every(item => typeof item === 'number')) {
        setSeenNotifications(new Set(parsedNotifications));
      } else {
        setSeenNotifications(new Set()); // Si no es un array de números, inicializamos como un Set vacío
      }
    }
  }, []);

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  
    // Marcar todas las notificaciones como vistas al abrir el panel
    const updatedSeenNotifications = new Set([...seenNotifications, ...notifications.map((n) => n.predictionId)]);
    setSeenNotifications(updatedSeenNotifications);
  
    // Al abrir, el contador de no vistas debe ser 0
    setUnreadCount(0);
  
    // Guardamos el estado actualizado en localStorage
    localStorage.setItem('seenNotifications', JSON.stringify(Array.from(updatedSeenNotifications)));
    localStorage.setItem('unreadCount', '0'); // Asegúrate de que esto se ejecute
  };

  const handleNotificationClose = (): void => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}
        >
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <IconButton
              onClick={(): void => {
                setOpenNav(true);
              }}
              sx={{ display: { lg: 'none' } }}
            >
              <ListIcon />
            </IconButton>
            {/* <Tooltip title="Buscar">
              <IconButton>
                <MagnifyingGlassIcon />
              </IconButton>
            </Tooltip> */}
          </Stack>
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
          <Tooltip title="Notificaciones">
            <Badge
              badgeContent={unreadCount} // Cambia aquí
              color="success"
            >
              {(userRole !== 'cashier' && userRole !== 'viewer') && (
                <IconButton onClick={handleNotificationOpen}>
                  <BellIcon />
                </IconButton>
              )}
            </Badge>
          </Tooltip>
            <Avatar
              onClick={userPopover.handleOpen}
              ref={userPopover.anchorRef}
              src={avatarUrl}
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        </Stack>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ width: 350 }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Últimas actualizaciones
          </Typography>
        </Box>

        <Box sx={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
          {notifications.length > 0 ? (
            <List>
              {notifications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((notification) => {
                  const isSeen = seenNotifications.has(notification.predictionId); // Cambia a predictionId
                  return (
                    <React.Fragment key={notification.predictionId}>
                      <ListItem
                        button
                        onClick={() => {handleNotificationClick(notification.predictionId)}} // Cambia a predictionId
                        sx={{
                          backgroundColor: isSeen ? 'grey.200' : 'background.paper', // Cambiar color si fue vista
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                              <br />
                              <Typography variant="caption" color="text.disabled">
                                {new Date(notification.createdAt).toLocaleString()}
                              </Typography>
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No hay notificaciones disponibles
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }} />
      </Popover>

      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
      <MobileNav
        onClose={() => {
          setOpenNav(false);
        }}
        open={openNav}
      />
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
} 