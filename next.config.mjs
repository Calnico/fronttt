/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: true,
    swcMinify: true,
    // Habilita el directorio 'app' para usar las nuevas características de App Router
    experimental: {
      appDir: true,
    },
    // Si estás usando imágenes de dominios externos, agrégalos aquí
    images: {
      domains: [],
    },
  };
  
  export default config;