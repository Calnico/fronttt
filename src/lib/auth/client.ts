'use client';

import type { User } from '@/types/user';
import { API_URL } from '@/config';

function generateToken(): string {
  const arr = new Uint8Array(12);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

export interface SignUpParams {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  role: string;
  email: string;
  phone: string;
  password: string;
  phoneNumber?: string;
}

export interface SimpleMessageResponse {
  message: string;
}

export interface DefaultErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface RegisterResponse {
  message: string;
}

export interface SupermarketSignUpParams {
  id?: number;
  name: string;
  address: {
    neighborhood: string;
    locationType: string;
    streetNumber: string;
    intersectionNumber: string;
    buildingNumber: string;
    additionalInfo: string;
  }
}

export interface AuditsParams {
  id: number;
  user: {
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    role: string;
    email: string;
  };
  table_name: string;
  action: string;
  timestamp: string;
}

export interface NotificationsParams{
  isRead: string;
  id: number;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  predictionId: number;
}

export interface PredictionsParams {
  id: number;
  image: File | undefined;
  result: string;
  createdAt: string;
  updatedAt: string;
  scheduleFrequency: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  password: string;
  token: string;
}

export interface UpdatePasswordAccountParams {
  password: string;
  userId: string;
}

export interface UploadImageParams {
  profileImage: File;
  token: string;
  userId: string;
}

// Define el tipo para la respuesta del login
interface LoginResponse {
  user: User;
  access_token?: string; // Cambia a opcional ya que puede no estar presente en caso de error
  error?: string; // Define si el error puede estar en la respuesta
  message?: string;
}

class AuthClient {
  getPasswordHash(): { passwordHash: string; } | PromiseLike<{ passwordHash: string; }> {
    throw new Error('Método no implementado.');
  }
  async signUp(params: SignUpParams): Promise<{ error?: string; message?: string | null }> {
    const { email, password, firstName, middleName, lastName, secondLastName, phoneNumber, role } = params;

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, middleName, lastName, secondLastName, email, password, phoneNumber, role }),
      });

      if (!response.ok) {
        const errorResponse: DefaultErrorResponse = await response.json();

        const errorMessage = errorResponse.message || 'Error al registrarse';
        return { error: errorMessage };
      }

      const data: RegisterResponse = await response.json();

      return { message: data.message };
    } catch (error) {

      return { error: 'Error de red' };
    }
  }

  async supermarketsignUp(params: SupermarketSignUpParams, _ownerId: string): Promise<{ error?: string }> {
    const token = generateToken();
    localStorage.setItem('custom-auth-token', token);

    try {
      // Realiza una petición para registrar el supermercado aquí
      const response = await fetch(`${API_URL}/supermarket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Añadir el token en el header
        },
        body: JSON.stringify(params), // Envía los parámetros como el cuerpo de la petición
      });

      if (!response.ok) {
        const errorResponse: DefaultErrorResponse = await response.json();
        return { error: errorResponse.message || 'Error al registrar el supermercado' };
      }
      // const data = await response.json();
    

      // Si el registro es exitoso, puedes manejar la respuesta aquí
      return {};
    } catch (error) {
      return { error: 'Error de red al registrar el supermercado' };
    }
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Autenticación social no implementada' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string; message?: string; isConfirmed?: boolean; isTokenExpired?: boolean; }> {
    const { email, password } = params;
  
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data: LoginResponse = await response.json();
  
      if (!response.ok) {
        if (data.message === 'Credenciales inválidas para el inicio de sesión.') {
          return { error: 'Usuario y/o contraseña incorrectos' };
        }
  
        if (data.message === 'Cuenta no confirmada.') {
          return { error: 'Tu cuenta no está confirmada, revisa tu correo para activarla' };
        }

        return { error: 'Ocurrió un error. Inténtalo de nuevo' };
      }
  
      const token = data.access_token;
      const user = data.user;
      const userId = data.user.id;
      if (!token) {
        return { error: 'Token no encontrado' };
      }
      if (!userId) {
        return { error: 'ID de usuario no encontrado' };
      }
      localStorage.setItem('custom-auth-token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', userId.toString());
      
      

      return {};
    } catch (error) {
      return { error: 'Error de red. Inténtalo de nuevo.' };
    }
  }    

  async resetPassword(params: ResetPasswordParams): Promise<{ error?: string | null }> {
    try {
      const { email } = params;
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as SimpleMessageResponse;

      if (!response.ok) {
        return { error: data.message || 'Error de confirmación de la cuenta' };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Fallo al reiniciar la contraseña de la cuenta' };
    }
  }

  async updatePassword(params: UpdatePasswordParams): Promise<{ error?: string | null }> {
    const { password } = params;
    try {
      const response = await fetch(`${API_URL}/auth/reset-password?token=${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as SimpleMessageResponse;

      if (!response.ok) {
        return { error: data.message || 'Error actualizando contraseña' };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Fallo al actualizar la contraseña' };
    }
  }

  async updatePasswordAccount(params: { password: string; user: { id: string } }): Promise<{ error?: string | null }> {
    const { password, user } = params;
  
    try {
      const response = await fetch(`${API_URL}/users/update-password/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
  
      const data = (await response.json()) as SimpleMessageResponse;
  
      if (!response.ok) {
        return { error: data.message || 'Error actualizando contraseña' };
      }
  
      return { error: null };
    } catch (err) {
      return { error: 'Fallo al actualizar la contraseña' };
    }
  }
  
  async uploadImage(params: UploadImageParams): Promise<{ error?: string | null }> {
    const { profileImage, token, userId } = params;
  
    const formData = new FormData();
    formData.append('image', profileImage);
  
    try {
      const response = await fetch(`${API_URL}/users/${userId}/profile-image`, {
        method: 'PATCH', // Cambiamos a PATCH
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      const data = await response.json() as unknown as { message?: string };

      if (!response.ok) {
        return { error: data.message || 'Error al subir la imagen' };
      }

  
      return { error: null };
    } catch (err) {
      return { error: 'Fallo al subir la imagen' };
    }
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = localStorage.getItem('custom-auth-token');
    const userId = localStorage.getItem('userId'); // Obtener el userId de localStorage
  
    if (!token || !userId) {
      return { data: null, error: 'No token or userId found' }; // Manejo de errores si no hay token o userId
    }
  
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        return { data: null, error: 'Failed to fetch user data from server' };
      }
  
      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user)); // Actualiza localStorage con el usuario obtenido

      
  
      return { data: user };
    } catch (error) {
      return { data: null, error: 'Error fetching user data' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('custom-auth-token');
    return {};
  }

  async confirmAccount({ token }: { token: string }): Promise<{ error?: string | null }> {
    try {
      const response = await fetch(`${API_URL}/auth/confirm?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as SimpleMessageResponse;

      if (!response.ok) {
        return { error: data.message || 'Error de confirmación de la cuenta' };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Fallo al confirmar la cuenta' };
    }
  }

  async validateToken({ token }: { token: string }): Promise<{ error?: string | null; message?: boolean }> {
    try {
      const response = await fetch(`${API_URL}/token/validate-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: boolean = await response.json();

      if (!response.ok) {
        return { error: 'Error validating token' };
      }

      return { error: null, message: data };
    } catch (err) {
      return { error: 'Error al confirmar la cuenta' };
    }
  }

  async comparePasswordByUserId({
    userId,
    password,
  }: {
    userId: string;
    password: string;
  }): Promise<{ error?: string | null; message?: boolean }> {
    try {
      const response = await fetch(`${API_URL}/users/compare-password/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data: boolean = await response.json();

      if (!response.ok) {
        return { error: 'Error comparando contraseñas' };
      }

      return { error: null, message: data };
    } catch (err) {
      return { error: 'Error al confirmar la cuenta' };
    }
  }

  async getPredictionById(id: number): Promise<{ data?: PredictionsParams | null; error?: string }> {
    const token = localStorage.getItem('custom-auth-token');
  
    try {
      const response = await fetch(`${API_URL}/predictions/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        return { data: null, error: 'Failed to fetch prediction data from server' };
      }
  
      const prediction = await response.json();
      return { data: prediction };
    } catch (error) {
      return { data: null, error: 'Error fetching prediction data' };
    }
  }

}

export const authClient = new AuthClient();