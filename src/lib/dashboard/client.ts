import { type User } from '@/types/user';
import { API_URL } from '@/config';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
  };
}

class DashboardClient {
  async getLatestProducts(): Promise<{ data: Product[] | null; error?: string }> {
    const token = localStorage.getItem('custom-auth-token');
    const storedUser: User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = storedUser.ownedSupermarket?.id || storedUser.supermarket?.id;

    if (!token || !supermarketId) {
      return { data: null, error: 'No token or userId found' };
    }

    try {
      const response = await fetch(`${API_URL}/products/supermarket/${supermarketId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { data: null, error: 'Failed to fetch products data from server' };
      }

      const products = await response.json();

      return { data: products };
    } catch (error) {
      return { data: null, error: 'Error fetching user data' };
    }
  }
}

export const dashboardClient = new DashboardClient();
