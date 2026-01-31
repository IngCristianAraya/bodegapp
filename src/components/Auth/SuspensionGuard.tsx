
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTenant } from '../../contexts/TenantContext';

export default function SuspensionGuard({ children }: { children: React.ReactNode }) {
    const { tenant, loading } = useTenant();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        // Skip check if no tenant (e.g. landing page or auth pages usually)
        // Adjust this logic if landing page is separate from tenant pages
        if (!tenant) return;

        if (tenant.status === 'suspended') {
            if (pathname !== '/suspended') {
                router.replace('/suspended');
            }
        } else {
            // Active or other status
            if (pathname === '/suspended') {
                router.replace('/');
            }
        }
    }, [tenant, loading, pathname, router]);

    // Opcional: Mostrar loading mientras verifica
    // if (loading) return null; // O un spinner

    return <>{children}</>;
}
