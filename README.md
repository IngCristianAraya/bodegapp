# BodegApp SaaS - Sistema de Gestión Premium para Bodegas 🏪

**BodegApp** es una plataforma **SaaS Multi-tenant** diseñada para digitalizar y escalar negocios de abarrotes y bodegas. Construida con una arquitectura de aislamiento de datos rigurosa, permite gestionar múltiples tiendas independientes bajo una misma infraestructura en la nube.

---

## 🏗️ Arquitectura SaaS Multi-tenant

| Característica | Implementación |
|----------------|----------------|
| **Aislamiento de datos** | Cada registro está vinculado a un `tenant_id` único |
| **Seguridad RLS** | Row Level Security a nivel de Supabase |
| **Routing dinámico** | Subdominios (ej: `mibodega.tubarrio.pe`) |
| **Planes SaaS** | FREE (100 productos) / PRO (ilimitado) |

---

## 🌟 Módulos Principales

### 📊 Dashboard Analytics
- Ventas en tiempo real (día/semana/mes)
- Gráficos interactivos con Recharts
- Matriz de rentabilidad por producto
- Predicción de agotamiento de stock
- Comparativas temporales
- Alertas de rotación de inventario

### 🛒 Punto de Venta (POS)
- Búsqueda rápida de productos
- Lector de código de barras integrado
- Carrito con cálculo automático de IGV
- Productos a granel (peso variable)
- Múltiples métodos de pago (Efectivo, Yape, Plin, Tarjeta)
- Impresión de tickets térmicos
- Selector de clientes para fiado/crédito

### 📦 Inventario (Kardex)
- CRUD completo de productos
- Control de stock con costo promedio
- Alertas de stock mínimo
- Control de fechas de vencimiento
- Historial de movimientos
- Ingresos de mercadería con proveedor
- Modificación rápida de precios
- PIN de administrador para acciones críticas

### 💰 Caja Registradora
- Apertura/cierre de caja con monto inicial
- Movimientos de efectivo (entradas/salidas)
- Historial completo de cajas
- Balance automático

### 👥 Gestión de Clientes
- Registro de clientes
- Historial de compras
- Control de deudas (fiado)

### 🚚 Proveedores
- Catálogo de proveedores
- Vinculación con productos e ingresos

### 💸 Control de Gastos
- Registro de gastos operativos
- Categorización de egresos
- Integración con reportes

### 📈 Reportes
- Dashboard de métricas
- Exportación a PDF y Excel
- Filtros por rango de fechas

### ⚙️ Configuración
- Datos de la tienda
- Logo personalizado
- QR de pago (Yape/Plin)
- PIN de administrador
- Respaldos de datos

---

## 🔐 Panel Super Admin

Panel exclusivo para administración de la plataforma SaaS:

- Gestión de todos los tenants
- Activar/suspender tiendas
- Registro de pagos de suscripción
- Broadcast de mensajes del sistema
- Analytics por tenant (ventas, productos)

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Frontend** | React 19, TypeScript |
| **Estilos** | TailwindCSS 4 |
| **Base de datos** | Supabase (PostgreSQL + RLS) |
| **Autenticación** | Supabase Auth |
| **Gráficos** | Recharts |
| **Exportación** | jsPDF, xlsx |
| **Iconos** | Lucide React |
| **PWA** | next-pwa |

---

## ⚡ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-repositorio>
cd bodegapp-next
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=<tu-url-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPER_ADMIN_KEY=<clave-super-admin>
```

### 4. Configurar base de datos
Ejecutar `supabase_setup.sql` en el SQL Editor de Supabase.

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

### 6. Build de producción
```bash
npm run build
npm run start
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                # Next.js App Router
│   ├── admin/          # Panel Super Admin
│   ├── clientes/       # Gestión de clientes
│   ├── proveedores/    # Gestión de proveedores
│   └── register/       # Registro de tiendas
├── components/         # Componentes React
│   ├── Auth/           # Autenticación
│   ├── CashRegister/   # Caja registradora
│   ├── Dashboard/      # Analytics
│   ├── Inventory/      # Inventario
│   ├── POS/            # Punto de venta
│   ├── Reports/        # Reportes
│   └── Settings/       # Configuración
├── contexts/           # React Contexts
├── hooks/              # Custom hooks
├── lib/                # Servicios Supabase
├── types/              # TypeScript types
└── utils/              # Utilidades
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Ejecutar build |
| `npm run lint` | Verificar código |

---

## 👤 Desarrollo

**Desarrollado por:**  
### **Ingeniero Cristian Araya**  
*Especialista en Soluciones SaaS y Arquitecturas Cloud*

---

> **Nota:** Para soporte técnico o implementaciones personalizadas, contactar con el equipo de desarrollo.
