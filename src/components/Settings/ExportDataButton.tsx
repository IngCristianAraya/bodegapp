import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { exportAllDataToCSV } from '../../lib/exportData';
import { useTenant } from '../../contexts/TenantContext';

const ExportDataButton: React.FC = () => {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const blob = await exportAllDataToCSV(tenant.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bodegapp-backup.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {

      alert('Error al exportar datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-semibold shadow mt-6"
    >
      {loading ? 'Exportando...' : 'Exportar datos'}
    </button>
  );
};

export default ExportDataButton;
