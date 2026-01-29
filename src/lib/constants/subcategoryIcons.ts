import {
    Package,
    // Abarrotes
    Bean, // Menestras (simulado)
    Wheat, // Pastas, Arroz, Pan
    Soup, // Salsas, Conservas
    Droplet, // Aceites
    Utensils, // Condimentos

    // Huevos y Lácteos
    Egg, // Huevos
    Milk, // Leche
    Cookie, // Yogur (simulado)
    Triangle, // Queso (simulado)

    // Carnes
    Drumstick, // Pollo
    Beef, // Res
    Sandwich, // Jamón, Salchichas (simulado)

    // Frutas y Verduras
    Apple, // Frutas
    Carrot, // Verduras
    Circle, // Tubérculos (fallback)

    // Bebidas
    CupSoda, // Gaseosas
    // Coffee, // Jugos (simulado) - REMOVED UNUSED
    GlassWater, // Aguas
    Zap, // Energéticas

    // Snacks
    Candy, // Caramelos
    IceCream, // Helados, Paletas
    Popsicle, // Paletas

    // Limpieza & Higiene
    SprayCan, // Lavavajillas, Desodorantes
    Sparkles, // Detergentes, Jabones
    Bath, // Shampoo

    // Mascotas
    Dog, // Perro
    Cat, // Gato
    Bone, // Accesorios

    // Descartables
    // Trash2, // Bolsas, Vasos - REMOVED UNUSED
    ChefHat, // Repostería
    // Snowflake, // Congelados - REMOVED UNUSED
    ShoppingBag,
    LucideIcon
} from 'lucide-react';

// Mapeo de subcategorías a iconos
export const subcategoryIcons: Record<string, LucideIcon> = {
    // Abarrotes
    'menestras': Bean,
    'pastas': Wheat,
    'arroz': Wheat,
    'salsas': Soup,
    'aceites': Droplet,
    'condimentos': Utensils,
    'conservas': Soup,

    // Huevos y Lácteos
    'huevos': Egg,
    'leche': Milk,
    'yogur': CupSoda,
    'queso': Triangle,
    'mantequilla': Package,

    // Carnes
    'pollo': Drumstick,
    'res': Beef,
    'salchichas': Sandwich,
    'jamón': Sandwich,

    // Frutas y Verduras
    'frutas': Apple,
    'verduras': Carrot,
    'tubérculos': Circle,

    // Bebidas
    'gaseosas': CupSoda,
    'jugos': CupSoda,
    'aguas': GlassWater,
    'energéticas': Zap,

    // Snacks
    'chocolates': Candy,
    'papas': Package,
    'galletas': Cookie,
    'caramelos': Candy,

    // Helados
    'cremoladas': IceCream,
    'paletas': Popsicle,
    'conos': IceCream,

    // Limpieza
    'lavavajillas': SprayCan,
    'detergentes': Sparkles,
    'multiusos': SprayCan,

    // Higiene
    'jabones': Sparkles,
    'shampoo': Bath,
    'desodorantes': SprayCan,
    'papel higiénico': Package,

    // Mascotas
    'alimento perro': Dog,
    'alimento gato': Cat,
    'accesorios': Bone,

    // Descartables
    'vasos': CupSoda,
    'platos': Utensils,
    'cubiertos': Utensils,
    'bolsas': ShoppingBag,

    // Panadería
    'pan': Wheat,
    'pan especial': Wheat,

    // Repostería
    'pasteles': ChefHat,
    'bizcochos': ChefHat,
    'ingredientes': Package,

    // Congelados
    'carnes': Beef,
    'comidas listas': Package,
};

export const getSubcategoryIcon = (subcategory: string): LucideIcon => {
    if (!subcategory) return Package;
    const normalized = subcategory.trim().toLowerCase();
    return subcategoryIcons[normalized] || Package;
};
