-- Separo mis datos en 4 esquemas: cada uno representa una etapa de confianza distinta.
-- raw: dato tal como llega de USGS, sin tocar.
-- staging: dato limpio y tipado, pero todavía no garantizado como "bueno para el negocio".
-- curated: solo lo que pasó mis validaciones de calidad; es lo único que lee mi api.
-- app: todo lo de mi plataforma (usuarios, roles de login), separado de los datos sísmicos.

-- Habilito esta extensión porque la necesito para generar UUID en varias tablas.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS curated;
CREATE SCHEMA IF NOT EXISTS app;
