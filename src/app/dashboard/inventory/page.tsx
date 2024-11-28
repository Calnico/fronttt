'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
//import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon  } from '@phosphor-icons/react/dist/ssr/Plus';
//import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { CompaniesFilters } from '@/components/dashboard/inventory/integrations-filters';
import { useForm, Controller } from 'react-hook-form';
import { Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Box, TextField, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText } from '@mui/material';
import { API_URL } from '@/config';
import { useUser } from '@/hooks/use-user';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  pricePerPound: number;
  weight: number;
  unitCost: number;
  category?: {
    id: number;
    name: string;
  };
  image: File | undefined;
}
interface Category {
  id: number;
  name: string;
  description: string;
  supermarketId: number;
}

interface Inventory {
  id: number;
  stock: number;
  product: Product;
}

export default function Page(): React.JSX.Element {
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(null);
  const [openEditProduct, setOpenEditProduct] = React.useState(false);
  const [openCategory, setOpenCategory] = React.useState(false);
  const [openProduct, setOpenProduct] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [products, setProducts] = React.useState<Inventory[]>([]); // Define el tipo para products
  const [productImages, setProductImages] = useState<Record<number, string>>({}); // Para almacenar URLs temporales de imágenes
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [productIdToDelete, setProductIdToDelete] = React.useState<number | null>(null);
  const { user } = useUser();

  const { control, handleSubmit, reset, formState: { isValid } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      pricePerPound: '',
      weight: '',
      unitCost: '',
      categoryId: '',
      stock: '',
      image: undefined,
    },
  });
  const filteredProducts = products.filter((inventory) =>
    inventory.product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

const handleOpenCategory = (): void => {
  setOpenCategory(true);
  reset({ 
    name: '',
    description: '',
  });
};

const handleCloseCategory = (): void => {
  setOpenCategory(false);
  reset({
    name: '',
    description: '',
  });
};

const handleOpenProduct = (): void => {
  setOpenProduct(true);
    reset({
      name: '',
      description: '',
      price: '',
      pricePerPound: '',
      weight: '',
      unitCost: '',
      categoryId: '',
      stock: '',
    });
};

const handleCloseProduct = (): void => {
  setPreviewImage(null);
  setOpenProduct(false);
  reset();
};

const handleOpenEditProduct = (product: Product, inventory: Inventory): void => {
  setProductToEdit(product);
  reset({
    name: product.name || '', // Asegúrate de manejar el caso donde product.name pueda ser undefined
    description: product.description || '',
    pricePerPound: product.pricePerPound !== undefined ? product.pricePerPound.toString() : '', // Convertir a string
    weight: product.weight !== undefined ? product.weight.toString() : '', // Convertir a string
    unitCost: product.unitCost !== undefined ? product.unitCost.toString() : '', // Convertir a string
    stock: inventory.stock !== undefined ? inventory.stock.toString() : '', // Convertir a string
    categoryId: product.category?.id ? product.category.id.toString() : '', // Convertir a string
  });
  setOpenEditProduct(true);
};

const handleCloseEditProduct = (): void => {
  setOpenEditProduct(false);
  reset();
};

// Cargar categorías solo del supermercado del usuario
const fetchCategories = useCallback(async (): Promise<void> => {
  try {
    const token = localStorage.getItem('custom-auth-token');
    const currentUser: User = JSON.parse(localStorage.getItem('user') || '{}'); // Obtenemos el usuario
    const supermarketId = currentUser.ownedSupermarket?.id || currentUser.supermarket?.id; // Obtenemos el supermarketId del usuario

    if (!supermarketId) {
      return;
    }

    const response = await fetch(`${API_URL}/categories/supermarket/${supermarketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data: Category[] = await response.json();
      setCategories(data);
    }
  } catch (error) {
    // Manejo de errores omitido
  }
}, []);

// Cargar productos solo del supermercado del usuario
const fetchProducts = useCallback(async (): Promise<void> => {
  try {
    const token = localStorage.getItem('custom-auth-token');
    const currentUser: User = JSON.parse(localStorage.getItem('user') || '{}');
    const supermarketId = currentUser.ownedSupermarket?.id || currentUser.supermarket?.id;

    if (!supermarketId) {
      return;
    }

    const response = await fetch(`${API_URL}/inventory/supermarket/${supermarketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data: Inventory[] = await response.json();
      setProducts(data);
      // Crear URLs de imágenes para cada producto si la imagen es de tipo `File`
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
}, []);

React.useEffect(() => {
  fetchCategories();
  fetchProducts();
}, [fetchCategories, fetchProducts]);

  interface Supermarket {
    id: number;
  }
  
  interface User {
    ownedSupermarket?: Supermarket;
    supermarket?: Supermarket;
  }

  interface CategoryFormData {
    name: string;
    description: string;
  }
  
  // Función para añadir categoría
  const onSubmitCategory = async (data: CategoryFormData): Promise<void> => {
    const currentUser: User = JSON.parse(localStorage.getItem('user') || '{}'); // Tipificar como User
    const supermarketId = currentUser.ownedSupermarket?.id || currentUser.supermarket?.id;
  
    if (!supermarketId) {
      return;
    }
  
    const categoryData = {
      name: data.name,
      description: data.description,
      supermarketId: Number(supermarketId),
    };
  
    try {
      const token = localStorage.getItem('custom-auth-token');
      if (!token) {
        return;
      }
  
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
      });
  
      if (response.ok) {
        handleCloseCategory();
        fetchCategories();
        setSnackbarMessage('Categoría creada con éxito');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Hubo un problema al crear la categoría');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      } catch (error) {
        setSnackbarMessage('Error al conectar con el servidor');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
  };
 // Función para añadir productos
 const onSubmitProduct = async (data: {
  name: string;
  description: string;
  pricePerPound: string;
  weight: string;
  unitCost: string;
  categoryId?: string;
  stock: string;
  image: File | undefined; 
}): Promise<void> => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  const currentUser: User = JSON.parse(localStorage.getItem('user') || '{}');
  const supermarketId = currentUser.ownedSupermarket?.id || currentUser.supermarket?.id;

  if (!supermarketId) {
    return;
  }

  // Preparar datos en FormData para el producto
  const productData = new FormData();
  productData.append('name', data.name);
  productData.append('description', data.description);
  productData.append('pricePerPound', data.pricePerPound);
  productData.append('weight', data.weight);
  productData.append('unitCost', data.unitCost);
  productData.append('supermarketId', supermarketId.toString());

  // Enviar categoryId con el valor de "Sin Categoría" si no se selecciona otra
  if (data.categoryId && data.categoryId !== "") {
    productData.append('categoryId', data.categoryId);
  }

  if (data.image) {
    productData.append('image', data.image);
  }
  
    try {
      const token = localStorage.getItem('custom-auth-token');
      if (!token) {
        return;
      }
  
      // Enviar solicitud POST a `/products` con FormData
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: productData,
      });
  
      // Verificar la respuesta del backend
      const product: Product = await response.json();
  
      if (!response.ok) {
        const errorMessage =
          product && typeof product === 'object' && 'message' in product 
            ? String(product.message) // Convertir a cadena de texto
            : 'Unknown error';
        throw new Error(`Error al crear el producto: ${errorMessage}`);
      }
      
  
      const inventoryData = {
        productId: product.id,
        supermarketId: Number(supermarketId),
        stock: Number(data.stock),
      };
  
      const responseInventory = await fetch(`${API_URL}/inventory/add-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inventoryData),
      });
  
      const inventoryResponse = (await responseInventory.json()) as { message?: string };
  
      if (!responseInventory.ok) {
        throw new Error(`Error al agregar stock al inventario: ${inventoryResponse.message || 'Unknown error'}`);
      }
  
      handleCloseProduct();
      fetchProducts();
      setSnackbarMessage('Producto añadido con éxito');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
  
    } catch (error) {
      setSnackbarMessage('Error al conectar con el servidor');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  // Función para eliminar producto
  const handleDeleteProduct = (productId: number): void => { 
    setProductIdToDelete(productId);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteProduct = async (): Promise<void> => { 
    if (productIdToDelete) { 
      const token = localStorage.getItem('custom-auth-token'); 
      if (!token) { 
        return; 
      }

      try { 
        const response = await fetch(`${API_URL}/products/${productIdToDelete}`, { 
          method: 'DELETE', 
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}`, 
          }, 
        });

      if (response.ok) {
        fetchProducts();
        setSnackbarMessage('Producto eliminado con éxito');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Hubo un problema al eliminar producto');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      } catch (error) {
        setSnackbarMessage('Error al conectar con el servidor');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally { 
        setOpenDeleteDialog(false); 
        setProductIdToDelete(null);
      } 
    } 
  };

  const onSubmitEditProduct = async (data: {
    name: string;
    description: string;
    pricePerPound: string;
    weight: string;
    unitCost: string;
    categoryId?: string;
    stock: string;
    
  }): Promise<void> => {
    if (!productToEdit) return; 
  
    const productData = {
      name: data.name,
      description: data.description,
      pricePerPound: Number(data.pricePerPound),
      weight: Number(data.weight),
      unitCost: Number(data.unitCost),
      categoryId: Number(data.categoryId),
    };
    const inventoryData = {
      stock: data.stock ? Number(data.stock) : 1,
    };
  
    try {
      const token = localStorage.getItem('custom-auth-token');
      const currentUser: User = JSON.parse(localStorage.getItem('user') || '{}');
      const supermarketId = currentUser.ownedSupermarket?.id || currentUser.supermarket?.id;
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/products/${productToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const responseInventory = await fetch(`${API_URL}/inventory/edit-stock/${productToEdit.id}/${supermarketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inventoryData),
      });
  
      if (response.ok && responseInventory.ok) {
            handleCloseEditProduct();
            fetchProducts();
            setSnackbarMessage('Producto editado con éxito');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        }else {
          setSnackbarMessage('Hubo un problema al editar producto');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
        } catch (error) {
          setSnackbarMessage('Error al conectar con el servidor');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
};

const handleSnackbarClose = (): void => {
  setSnackbarOpen(false);
};



    return (
  <Stack spacing={3}>
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        {/* Título y botones de Importar/Exportar */}
        <Stack spacing={1}>
          <Typography variant="h4">Inventario</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {/* Aquí puedes añadir otros botones o acciones */}
          </Stack>
        </Stack>
      </Grid>

      <Grid item xs={12} md={4}>
        {/* Botones en columna */}
        {user?.role !== 'viewer' &&(
        <Stack spacing={2}>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpenCategory}>
            Añadir Cortes
          </Button>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpenProduct}>
            Añadir Carne
          </Button>
        </Stack>
        )}
      </Grid>
    </Grid>

    <CompaniesFilters onSearch={setSearchTerm} />

    {/* Listado de productos */}
    <Stack spacing={2}>
      <Typography variant="h5">Listado de Carnes</Typography>
      {products.length === 0 ? (
      <Typography align="center">No hay productos disponibles.</Typography>
    ) : (
      <Grid container spacing={3}>
    {filteredProducts.length > 0 ? (
      filteredProducts.map((inventory) => (
        
        <Grid item xs={12} md={6} lg={4} key={inventory.product.id}>
  <Stack
    spacing={1}
    sx={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: 2,
      minHeight: '300px',
      display: 'flex',
      justifyContent: 'space-between',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.3s ease',
      '&:hover': {
        transform: 'scale(1.02)',
      },
      position: 'relative',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: '120px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: productImages[inventory.product.id] ? 'none' : '1px solid #ccc',
        backgroundColor: productImages[inventory.product.id] ? 'transparent' : '#f9f9f9',
        borderRadius: 1,
      }}
    >
      {productImages[inventory.product.id] ? (
        <img
          src={productImages[inventory.product.id]}
          alt={inventory.product.name}
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

    <Typography
      variant="h6"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {inventory.product.name} {inventory.product.weight} gramos
    </Typography>

    <Typography
      variant="body1"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {inventory.product.description}
    </Typography>

    <Typography variant="body2">Precio total: ${inventory.product.price}</Typography>
    <Typography variant="body2">Peso: {inventory.product.weight} gramos</Typography>
    <Typography variant="body2">Precio por gramo: ${inventory.product.pricePerPound}</Typography>
    <Typography variant="body2">Stock: {inventory.stock}</Typography>
   <Typography
      variant="body2"
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
     Corte: {inventory.product.category?.name || 'Sin Corte'} 
    </Typography>

    {/* Reserva el espacio de los botones si el rol es viewer */}
    {user?.role === 'viewer' ? (
      <Box sx={{ height: '80px' }} /> // Espacio reservado para mantener el diseño
    ) : (
      <>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            handleOpenEditProduct(inventory.product, inventory);
          }}
          startIcon={<PencilIcon />}
        >
          Editar
        </Button>
        {user?.role !== 'cashier' && (
      <Button
        variant="outlined"
        color="error"
        onClick={() => {
          handleDeleteProduct(inventory.product.id);
        }}
        startIcon={<TrashIcon />}
      >
        Eliminar
      </Button>
    )}
  </>
)}
  </Stack>
</Grid>

      ))
    ) : (
      /* Mensaje cuando no hay productos filtrados disponibles */
      <Grid item xs={12}>
      <Typography align="center">
        No hay productos filtrados disponibles.
      </Typography>
    </Grid>
  )}
  </Grid>
  )}
  </Stack>

    {/* Modal para añadir producto */}
    <Dialog open={openProduct} 
    onClose={handleCloseProduct}
    maxWidth="md" // Cambia el ancho máximo, puedes probar con "lg" también
    fullWidth // Esto permite que el modal use el ancho máximo definido
    sx={{ '& .MuiDialog-paper': { width: '400px', maxWidth: '100%' } }} // Personaliza el ancho
    >
      <DialogTitle>Añadir Carne</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'El nombre es obligatorio' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nombre"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error ? fieldState.error.message : ''}
                inputProps={{ maxLength: 50,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                }}
                sx={{ marginTop: '5px' }}
                required
              />
            )}
          />
          
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field}
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 30,
                onInput: (event) => {
                  const input = event.target as HTMLInputElement;
                  input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                }
              }} />
            )}
          />
          <Controller
            name="pricePerPound"
            control={control}
            rules={{
              required: 'El precio por gramo es obligatorio',
              validate: (value) => /^[0-9]*\.?[0-9]{0,2}$/.test(value) || 'Solo se permiten números y hasta dos decimales'
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Precio por gramo"
                fullWidth
                type="text"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error ? fieldState.error.message : ''}
                inputProps={{
                  maxLength: 10,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permite solo números y hasta dos decimales
                  if (/^[0-9]*\.?[0-9]{0,2}$/.test(value) || value === "") {
                    field.onChange(value); // Solo actualiza el valor si cumple la condición
                  }
                }}
                required
              />
            )}
          /> 

<Controller
            name="unitCost"
            control={control}
            rules={{
              required: 'El costo por unidad es obligatorio',
              validate: (value) => /^[0-9]*\.?[0-9]{0,2}$/.test(value) || 'Solo se permiten números y hasta dos decimales'
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Costo por unidad"
                fullWidth
                type="text"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error ? fieldState.error.message : ''}
                inputProps={{
                  maxLength: 10,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permite solo números y hasta dos decimales
                  if (/^[0-9]*\.?[0-9]{0,2}$/.test(value) || value === "") {
                    field.onChange(value); // Solo actualiza el valor si cumple la condición
                  }
                }}
                required
              />
            )}
          /> 

<Controller
            name="weight"
            control={control}
            rules={{
              required: 'El peso es obligatorio',
              validate: (value) => /^[0-9]*\.?[0-9]{0,2}$/.test(value) || 'Solo se permiten números y hasta dos decimales'
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Peso en gramos"
                fullWidth
                type="text"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error ? fieldState.error.message : ''}
                inputProps={{
                  maxLength: 10,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permite solo números y hasta dos decimales
                  if (/^[0-9]*\.?[0-9]{0,2}$/.test(value) || value === "") {
                    field.onChange(value); // Solo actualiza el valor si cumple la condición
                  }
                }}
                required
              />
            )}
          /> 

            <Controller
              name="stock"
              control={control}
              defaultValue="" // Comienza vacío
              rules={{
                validate: (value) =>
                  value === "" || /^[0-9]*\.?[0-9]$/.test(value) || "Solo se permiten números y hasta dos decimales",
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Stock"
                  fullWidth
                  type="text"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error ? fieldState.error.message : ""}
                  inputProps={{
                    maxLength: 10,
                    onInput: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir solo números, hasta dos decimales, o vacío
                    if (/^[0-9]*\.?[0-9]$/.test(value) || value === "") {
                      field.onChange(value); // Solo actualiza el valor si cumple la condición
                    }
                  }}
                />
              )}
            />

 <Controller
  name="categoryId"
  control={control}
  render={({ field, fieldState }) => (
    <FormControl fullWidth error={Boolean(fieldState.error)}>
      <InputLabel id="category-select-label">Cortes</InputLabel>
      <Select
        {...field}
        label="Corte"
        id="category-select"
        value={field.value || ""} // Mantiene el valor como una cadena vacía si no se selecciona ninguna categoría

      >
        <MenuItem value="">
          <em>Sin Corte</em>
        </MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
      {typeof fieldState.error?.message === 'string' && (<Typography color="error">{fieldState.error.message}</Typography>)}
    </FormControl>
  )}
/>

          {/* Controlador de subida de imagen */}
          <Controller
            name="image"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    field.onChange(file); // Set file as value
                    if (file) {
                      setPreviewImage(URL.createObjectURL(file)); // Crear URL para vista previa
                    } else {
                      setPreviewImage(null); // Reset preview if no file
                    }
                  }}
                  style={{ display: 'none' }} // Ocultar el input de archivo
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="contained" color="primary" component="span">
                    Subir imagen
                  </Button>
                </label>
                {typeof fieldState.error?.message === 'string' && (<Typography color="error">{fieldState.error.message}</Typography>)}

                {/* Vista previa de la imagen */}
                {typeof previewImage === 'string' && (
                  <Box mt={2} display="flex" justifyContent="center">
                    <img
                      src={previewImage}
                      alt="Vista previa"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    />
                  </Box>
                )}
              </>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseProduct} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSubmit(onSubmitProduct)} variant="contained" disabled={!isValid}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>

    

    {/* Modal para añadir categoría */}
    <Dialog open={openCategory}
    onClose={handleCloseCategory}
    maxWidth="md" // Cambia el ancho máximo, puedes probar con "lg" también
    fullWidth // Esto permite que el modal use el ancho máximo definido
    sx={{ '& .MuiDialog-paper': { width: '400px', maxWidth: '100%' } }} // Personaliza el ancho
    >
      <DialogTitle>Añadir Categoria</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'El nombre es obligatorio' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nombre"
                fullWidth
                error={Boolean(fieldState.error)}
                helperText={fieldState.error ? fieldState.error.message : ''}
                inputProps={{ maxLength: 50,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                }}
                sx={{ marginTop: '5px' }}
                required
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Descripción"
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 200,
                onInput: (event) => {
                  const input = event.target as HTMLInputElement;
                  input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                }
              }}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseCategory} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSubmit(onSubmitCategory)} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal para editar producto */}
  <Dialog open={openEditProduct} 
  onClose={handleCloseEditProduct}
    maxWidth="md" // Cambia el ancho máximo, puedes probar con "lg" también
    fullWidth // Esto permite que el modal use el ancho máximo definido
    sx={{ '& .MuiDialog-paper': { width: '400px', maxWidth: '100%' } }}
  >
    <DialogTitle>Editar Producto</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'El nombre es obligatorio' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Nombre"
              fullWidth
              error={Boolean(fieldState.error)}
              helperText={fieldState.error ? fieldState.error.message : ''}
              inputProps={{ maxLength: 50,
                onInput: (event) => {
                  const input = event.target as HTMLInputElement;
                  input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                }
              }}
              sx={{ marginTop: '5px' }}
              required
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field}
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            inputProps={{ maxLength: 30,
              onInput: (event) => {
                const input = event.target as HTMLInputElement;
                input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
              }
            }} />
          )}
        />
        <Controller
          name="pricePerPound"
          control={control}
          rules={{
            required: 'El precio por gramo es obligatorio',
            validate: (value) => /^[0-9]*\.?[0-9]{0,2}$/.test(value) || 'Solo se permiten números y hasta dos decimales'
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Precio por gramo"
              fullWidth
              type="text"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error ? fieldState.error.message : ''}
              inputProps={{
                maxLength: 10,
                onInput: (event) => {
                  const input = event.target as HTMLInputElement;
                  input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[0-9]*\.?[0-9]{0,2}$/.test(value) || value === "") {
                  field.onChange(value);
                }
              }}
              required
            />
          )}
        /> 

<Controller
          name="weight"
          control={control}
          rules={{
            required: 'El peso es obligatorio',
            validate: (value) => /^[0-9]*\.?[0-9]{0,2}$/.test(value) || 'Solo se permiten números y hasta dos decimales'
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Peso en gramos"
              fullWidth
              type="text"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error ? fieldState.error.message : ''}
              inputProps={{
                maxLength: 10,
                onInput: (event) => {
                  const input = event.target as HTMLInputElement;
                  input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[0-9]*\.?[0-9]{0,2}$/.test(value) || value === "") {
                  field.onChange(value);
                }
              }}
              required
            />
          )}
        /> 

<Controller
            name="unitCost"
            control={control}
            rules={{
              required: 'El costo por unidad es obligatorio',
              validate: (value) => /^[0-9]*\.?[0-9]{0,2}$/.test(value) || 'Solo se permiten números y hasta dos decimales'
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Costo por unidad"
                fullWidth
                type="text"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error ? fieldState.error.message : ''}
                inputProps={{
                  maxLength: 10,
                  onInput: (event) => {
                    const input = event.target as HTMLInputElement;
                    input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permite solo números y hasta dos decimales
                  if (/^[0-9]*\.?[0-9]{0,2}$/.test(value) || value === "") {
                    field.onChange(value); // Solo actualiza el valor si cumple la condición
                  }
                }}
                required
              />
            )}
          /> 

            <Controller
              name="stock"
              control={control}
              rules={{
                validate: (value) =>
                  value === "" || /^[0-9]*\.?[0-9]$/.test(value) || "Solo se permiten números y hasta dos decimales",
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Stock"
                  fullWidth
                  type="text"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error ? fieldState.error.message : ""}
                  inputProps={{
                    maxLength: 10,
                    onInput: (event) => {
                      const input = event.target as HTMLInputElement;
                      input.value = input.value.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir solo números, hasta dos decimales, o vacío
                    if (/^[0-9]*\.?[0-9]$/.test(value) || value === "") {
                      field.onChange(value); // Solo actualiza el valor si cumple la condición
                    }
                  }}
                />
              )}
            /> 

       <Controller
          name="categoryId"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl fullWidth error={Boolean(fieldState.error)}>
              <InputLabel id="category-select-label">Cortes</InputLabel>
              <Select {...field} label="Cortes" id="category-select">
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {typeof fieldState.error?.message === 'string' && <Typography color="error">{fieldState.error.message}</Typography>}
            </FormControl>
          )}
        />
        
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCloseEditProduct} color="inherit">
        Cancelar
      </Button>
      <Button onClick={handleSubmit(onSubmitEditProduct)} disabled={isSubmitting} variant="contained">
        Guardar
      </Button>
    </DialogActions>
  </Dialog>
  
  <Dialog open={openDeleteDialog} onClose={() => {setOpenDeleteDialog(false)}}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {setOpenDeleteDialog(false)}} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteProduct} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

<Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
</Stack>
  );
}
