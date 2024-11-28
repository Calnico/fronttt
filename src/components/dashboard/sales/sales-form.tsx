'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/';
import MenuItem from '@mui/material/MenuItem';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { API_URL } from '@/config';
import { Plus, DownloadSimple } from '@phosphor-icons/react';
import type { User } from '@/types/user';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  pricePerPound: number;
  weight: number;
  category?: {
    id: number;
    name: string;
  };
  image: File | undefined;
}

interface Inventory {
  id: number;
  stock: number;
  product: Product;
}

interface SaleProduct {
  productId: number;
  quantity: number;
  weight: number;
  productName: string;
  totalPrice: number;
}

interface SaleResponse {
  id: number;

}


export function SalesForm(): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Inventory[]>([]);
  const [productImages, setProductImages] = useState<Record<number, string>>({});
  const [productQuantities, setProductQuantities] = useState<SaleProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [quantity, setQuantity] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const router = useRouter();

  useEffect(() => {
    const allowedRoles = ['admin', 'owner', 'cashier'];
    // Verifica el rol del usuario y redirige si no es uno de los permitidos
    const storedUser: User = JSON.parse(localStorage.getItem('user') || '{}');
    if (!allowedRoles.includes(storedUser.role)) {
      router.replace('errors/not-found'); // Redirige a una página de acceso no autorizado
    }
  }, [router]);

  // Cargar productos desde el backend
  const fetchProducts = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('custom-auth-token');
      const user: User = JSON.parse(localStorage.getItem('user') || '{}');
      const supermarketId = user.ownedSupermarket?.id || user.supermarket?.id;

      if (!supermarketId) return;

      const response = await fetch(`${API_URL}/inventory/supermarket/${supermarketId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: Inventory[] = await response.json();
        setProducts(data);
        const imageUrls: Record<number, string> = {};
        data.forEach((inventory) => {
          if (inventory.product.image instanceof File) {
            imageUrls[inventory.product.id] = URL.createObjectURL(inventory.product.image);
          } else if (typeof inventory.product.image === 'string') {
            imageUrls[inventory.product.id] = inventory.product.image; // Usar URL almacenada si ya es una cadena
          }
        });
        setProductImages(imageUrls);
      }
    } catch {
      setSnackbarMessage('Error al cargar productos');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Manejar selección del producto
  const handleProductChange = (event: SelectChangeEvent): void => {
    const productId = Number(event.target.value);
    const selectedInventory = products.find(item => item.product.id === productId);
    if (selectedInventory) {
      setSelectedProduct(selectedInventory.product);
      setAvailableStock(selectedInventory.stock);
    }
  };

  // Manejar cambio de cantidad
  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    // Permite solo números positivos y evita valores negativos o símbolos
    if (/^\d+$/.test(value) || value === "") {
      setQuantity(value);
    }
  };

// Añadir producto a la venta
const handleAddProduct = (): void => {
  if (!selectedProduct || !quantity || parseInt(quantity, 10) <= 0) {
    setSnackbarMessage('Seleccione un producto y una cantidad válida');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return;
  }

  const quantityValue = parseInt(quantity, 10);
  if (quantityValue > availableStock) {
    setSnackbarMessage(`La cantidad no puede exceder el stock disponible (${availableStock})`);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return;
  }

  setProductQuantities(prev => {
    const existingProductIndex = prev.findIndex(
      item => item.productId === selectedProduct.id
    );

    if (existingProductIndex !== -1) {
      // Si el producto ya existe, actualizar cantidad y precio total
      const updatedQuantities = [...prev];
      const existingProduct = updatedQuantities[existingProductIndex];
      
      // Sumar la nueva cantidad a la cantidad existente
      const newQuantity = existingProduct.quantity + quantityValue;
      const newWeight = existingProduct.weight + selectedProduct.weight;
      updatedQuantities[existingProductIndex] = {
        ...existingProduct,
        quantity: newQuantity,
        weight: newWeight,
        totalPrice: newQuantity * selectedProduct.price // Calcular el precio total basado en la cantidad total
      };
      return updatedQuantities;
    }

    // Si el producto no existe, añadir nuevo
    return [
      ...prev,
      {
        productId: selectedProduct.id,
        quantity: quantityValue,
        weight: selectedProduct.weight,
        productName: selectedProduct.name,
        totalPrice: quantityValue * selectedProduct.price,
      },
    ];
  });

  // Actualizar stock en el estado local de products
  setProducts(prevProducts => prevProducts.map(item => {
    if (item.product.id === selectedProduct.id) {
      return {
        ...item,
        stock: item.stock - quantityValue, // Restar la cantidad vendida del stock
      };
    }
    return item;
  }));

  setSelectedProduct(null);
  setQuantity('');
  setAvailableStock(0);

  setSnackbarMessage(`Producto "${selectedProduct.name}" agregado a la venta`);
  setSnackbarSeverity('success');
  setSnackbarOpen(true);
};


  // Eliminar producto
const handleRemoveProduct = (index: number): void => {
  const productToRemove = productQuantities[index];
  setProductQuantities(prevQuantities => prevQuantities.filter((_, i) => i !== index));

  // Restaurar el stock del producto eliminado
  setProducts(prevProducts =>
    prevProducts.map(item => {
      if (item.product.id === productToRemove.productId) {
        return {
          ...item,
          stock: item.stock + productToRemove.quantity, // Restaurar el stock
        };
      }
      return item;
    })
  );

    // Verificar si el producto eliminado es el mismo que el seleccionado actualmente
    if (selectedProduct && selectedProduct.id === productToRemove.productId) {
      // Limpiar los campos de producto seleccionado si coincide
      setSelectedProduct(null);
      setAvailableStock(0);
      setQuantity('');
    }

  setSnackbarMessage(`Producto "${productToRemove.productName}" eliminado de la venta`);
  setSnackbarSeverity('success');
  setSnackbarOpen(true);
};

  

  // Enviar venta al backend
  const handleSubmitSale = async (): Promise<void> => {
    if (productQuantities.length === 0) {
    setSnackbarMessage('Agregue al menos un producto con cantidad válida antes de finalizar la venta');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return;
  }
    try {
      const user: User = JSON.parse(localStorage.getItem('user') || '{}') as User;
      const supermarketId = user.ownedSupermarket?.id || user.supermarket?.id;

      const saleData = {
        userId: user.id,
        supermarketId,
        productQuantities: productQuantities.map(({ productId, quantity: itemQuantity }) => ({
          productId,
          quantity: itemQuantity,
        })),
      };

      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('custom-auth-token')}`,
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error('Error al realizar la venta');
      }

      setSnackbarMessage('Venta realizada con éxito');
      setSnackbarSeverity('success');
      setProductQuantities([]);

      const sale = (await response.json()) as SaleResponse;
      const saleId = sale.id; // Ahora TypeScript reconoce `id` de `sale` como seguro


    // Llamar al endpoint para obtener el PDF de la factura
    const invoiceResponse = await fetch(`${API_URL}/sales/${saleId}/invoice`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('custom-auth-token')}`,
      },
    });

    if (invoiceResponse.ok) {
      const blob = await invoiceResponse.blob();
      const newPdfUrl = URL.createObjectURL(blob); // Renombrado para evitar conflicto
      setPdfUrl(newPdfUrl);
      setDialogOpen(true);
      setSnackbarMessage('Venta realizada con éxito');
      setSnackbarSeverity('success');
    } else {
      throw new Error('Error al obtener la factura');
    }
    } catch (error) {
      setSnackbarMessage('Error al realizar la venta');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
    
};

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Card>
      <CardHeader title="Registro de Venta" subheader="Añade carnes a la venta" />
      <Divider />
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item md={6} xs={12}>
            <FormControl fullWidth>
              <InputLabel>Carnes</InputLabel>
              <Select
                label="Producto"
                value={selectedProduct?.id.toString() || ''}
                onChange={handleProductChange}
              >
                {products.map(item => (
                  <MenuItem key={item.product.id} value={item.product.id}>
                    {item.product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item md={4} xs={12}>
            <FormControl fullWidth>
              <InputLabel>Cantidad</InputLabel>
              <OutlinedInput
                label="Cantidad"
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                inputProps={{
                  max: availableStock,
                  min: 1,
                }}
              />
            </FormControl>
          </Grid>

          <Grid item md={2} xs={12}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddProduct}
              startIcon={<Plus />}
              fullWidth
            >
              Añadir
            </Button>
          </Grid>

          {/* Mostrar información del producto seleccionado */}
          {selectedProduct && (
  <Grid item xs={12}>
    <Card variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: 120,
          height: 80,
          mr: 2, // Espacio a la derecha de la imagen
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: productImages[selectedProduct.id] ? 'none' : '1px solid #ccc', // Sin borde si hay imagen
          backgroundColor: productImages[selectedProduct.id] ? 'transparent' : '#f9f9f9', // Fondo transparente si hay imagen
          borderRadius: 1,
        }}
      >
        {productImages[selectedProduct.id] ? (
          <img
            src={productImages[selectedProduct.id]}
            alt={selectedProduct.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sin imagen
          </Typography>
        )}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6">{selectedProduct.name} {selectedProduct.weight} gramos</Typography>
        <Typography>Descripción: {selectedProduct.description}</Typography>
        <Typography>Precio por gramo: ${selectedProduct.pricePerPound}</Typography>
        <Typography>Stock Disponible: {availableStock}</Typography>
      </Box>
    </Card>
  </Grid>
)}


          {/* Lista de productos añadidos */}
{productQuantities.map((item, index) => (
  <Grid item xs={12} key={index}>
    <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
      {/* Imagen del producto */}
      <Box
        sx={{
          width: 70,
          height: 70,
          mr: 2, // Espacio entre la imagen y los detalles
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: productImages[item.productId] ? 'none' : '1px dashed gray',
          backgroundColor: productImages[item.productId] ? 'transparent' : '#f9f9f9',
        }}
      >
        {productImages[item.productId] ? (
          <img
            src={productImages[item.productId]}
            alt={item.productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sin imagen
          </Typography>
        )}
      </Box>

      {/* Detalles del producto */}
      <div style={{ flexGrow: 1 }}>
        <Typography variant="h6">{item.productName} de {item.weight} gramos</Typography>
        <Typography>Cantidad: {item.quantity}</Typography>
        <Typography>Precio Total: ${item.totalPrice.toFixed()}</Typography>
      </div>

      {/* Botón de eliminar */}
      <Button
        variant="outlined"
        color="error"
        onClick={() => { handleRemoveProduct(index); }}
        startIcon={<TrashIcon />}
      >
        Eliminar
      </Button>
    </Card>
  </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmitSale}
          sx={{ mt: 3 }}
          fullWidth
        >
          Guardar Venta
        </Button>
      </CardContent>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => { setSnackbarOpen(false); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => { setSnackbarOpen(false); }} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación con vista previa del PDF */}
    <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Se realizó su venta exitosamente</Typography>
          <IconButton
            component="a"
            href={pdfUrl || '#'} // Enlace al PDF generado
            download="Factura_Venta.pdf" // Nombre del archivo descargado
            aria-label="Descargar PDF"
            sx={{
              position: 'absolute',
              right: { xs: 8, md: 48 }, // Ajusta la distancia desde la derecha en pantallas pequeñas y grandes
              top: 8,
              width: { xs: 32, md: 48 }, // Tamaño responsive del botón
              height: { xs: 32, md: 48 },
            }} // Posición ajustada
          >
            <DownloadSimple size={24} />
          </IconButton>
          <IconButton
            aria-label="close"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          />
        </DialogTitle>
        <DialogContent>
          {pdfUrl && (
            <iframe src={pdfUrl} width="100%" height="500px" title="Vista previa de la factura" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); }} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
