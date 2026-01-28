# BodegApp SaaS - Sistema de Gestión Premium para Bodegas 🚀

**BodegApp** es una plataforma **SaaS Multi-tenant** de última generación diseñada para digitalizar y escalar negocios de abarrotes y bodegas. Construida con una arquitectura de aislamiento de datos rigurosa, permite gestionar múltiples tiendas independientes bajo una misma infraestructura en la nube.

---

## 🏗️ Arquitectura SaaS Multi-tenant
A diferencia de sistemas tradicionales, BodegApp utiliza un modelo de **Base de Datos Compartida con Aislamiento Lógico**:
- **Aislamiento por Tenant:** Cada registro está vinculado a un `tenant_id` único.
- **Seguridad RLS (Row Level Security):** Implementado a nivel de base de datos en Supabase para garantizar que ninguna bodega acceda a datos ajenos.
- **Routing por Subdominio:** Resolución dinámica de inquilinos mediante subdominios (ej: `demo.localhost:3000` o `bodega01.tuapp.com`).

---

## 🌟 Características Principales

- **Dashboard Inteligente:** Métricas en tiempo real con Bento Grid UI, gráficos interactivos y KPIs de rendimiento.
- **Punto de Venta (POS) Pro:** Interfaz optimizada para velocidad, soporte para lectores de barras, gestión de descuentos y múltiples métodos de pago.
- **Gestión de Inventario (Kardex):** Control exhaustivo de stock, costos promedio, alertas de stock mínimo e historial de movimientos.
- **Gestión de Entidades:** Módulos completos para Clientes y Proveedores con historial transaccional.
- **Reportes Avanzados:** Generación de informes financieros y de inventario exportables a Excel (XLSX) y PDF.
- **Diseño Premium:** Interfaz moderna con Glassmorphism, animaciones fluidas y modo oscuro integrado.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript.
- **Estilos:** TailwindCSS (Diseño Responsivo y Moderno).
- **Backend & DB:** Supabase (PostgreSQL) con políticas RLS activas.
- **Autenticación:** Supabase Auth (Manejo de sesiones y roles de usuario).
- **Iconografía:** Lucide React & React Icons.
- **Gráficos:** Recharts.
- **Exportación:** JSPDF & XLSX.

---

## ⚡ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [URL-DEL-REPOSITORIO]
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Variables de Entorno:**
   Configura tu `.env.local` con las credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```
4. **Base de Datos:**
   Ejecuta el script `supabase_setup.sql` en el SQL Editor de tu proyecto de Supabase para inicializar la estructura multi-tenant.
5. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

---

## 👤 Desarrollo y Créditos

Este sistema ha sido diseñado y desarrollado con altos estándares de ingeniería para ofrecer una solución robusta y escalable al sector minorista.

**Desarrollado por:**
### **Ingeniero Cristian Araya** 
*Especialista en Soluciones SaaS y Arquitecturas Cloud*

---

> [!NOTE]
> Este proyecto se encuentra en constante evolución. Para soporte técnico o implementaciones personalizadas, contactar con el equipo de desarrollo.
