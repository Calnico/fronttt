import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

// Define el tipo para la función onSearch
type OnSearchFunction = (searchValue: string) => void;

interface CompaniesFiltersProps {
  onSearch: OnSearchFunction; // Utiliza el tipo definido aquí
}

export function CompaniesFilters({ onSearch }: CompaniesFiltersProps): React.JSX.Element {
  return (
    <Card sx={{ p: 2 }}>
      <OutlinedInput
        defaultValue=""
        fullWidth
        placeholder="Buscar"
        onChange={(e) => { 
          onSearch(e.target.value); // Actualiza el valor de búsqueda 
        }}
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
          </InputAdornment>
        }
        sx={{ maxWidth: '500px' }}
      />
    </Card>
  );
}
