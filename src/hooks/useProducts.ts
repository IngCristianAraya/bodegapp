/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { obtenerProductos } from '../lib/supabaseProducts';
import type { Product } from '../types/inventory';

export const useProducts = (tenantId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!tenantId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await obtenerProductos(tenantId);
      const productsData = data.map((item: any) => ({
        ...item,
        unitType: item.unitType || (item.unit === 'kg' ? 'kg' : 'unidad'),
        ventaPorPeso: typeof item.ventaPorPeso === 'boolean' ? item.ventaPorPeso : (item.unit === 'kg'),
      } as Product));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
};