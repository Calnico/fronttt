export const translateModule = (tableName: string): string => {
  // Función para convertir de snake_case a camelCase con un grupo nombrado
  const snakeToCamel = (str: string): string =>
    str.replace(/_(?<char>[a-z])/g, (_, { char }: { char: string }): string => char.toUpperCase());

  // Convertir tableName de snake_case a camelCase
  const camelCaseName = snakeToCamel(tableName);

  // Diccionario de traducciones
  const translations: Record<string, string> = {
    products: "Gestión de Productos",
    inventory: "Gestión de Inventario",
    user: "Gestión de Usuarios",
  };

  // Buscar traducción
  return translations[camelCaseName] || camelCaseName; // Devuelve el valor original si no hay traducción
};

export const translateRole = (role: string): string => {
  const translations: Record<string, string> = {
    admin: 'Administrador',
    viewer: 'Observador',
    cashier: 'Cajero',
    owner: 'Propietario',
  };

  return translations[role] || role; // Devuelve el valor original si no hay traducción
};
  
  export const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
      "INSERT": 'Insertar',
      "UPDATE": 'Actualizar',
      "DELETE": 'Eliminar',
    };
  
    return translations[action] || action; // Devuelve el valor original si no hay traducción
  };
  
  export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return "Fecha no disponible";
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Fecha inválida"
      : date.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
  };
  
  export const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return "Hora no disponible";
    }
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Hora inválida"
      : date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };
  