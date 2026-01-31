import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const steps = [
  {
    icon: '⚙️',
    title: '1. Configuración Inicial',
    description: 'Antes de empezar, ve a "Personalización" para ingresar el nombre de tu tienda, RUC y dirección. Estos datos aparecerán en tus tickets de venta.'
  },
  {
    icon: '📦',
    title: '2. Gestión de Inventario',
    description: 'En la sección "Inventario", carga tus productos. Puedes establecer el "Stock Mínimo" para recibir alertas automáticas cuando te quedes sin mercadería. ¡Usa las alertas de vencimiento para evitar pérdidas!'
  },
  {
    icon: '🛒',
    title: '3. Punto de Venta (POS)',
    description: 'Para vender, selecciona los productos y elige el método de pago (Efectivo, Yape, Plin o Tarjeta). Si usas Yape/Plin, el sistema registrará estos montos por separado para tu cuadre de caja.'
  },
  {
    icon: '🔒',
    title: '4. Control de Caja (Cierre Ciego)',
    description: 'Al abrir caja, ingresa tu sencillo inicial. Al cerrar, el sistema usará el modo "Cierre Ciego": no te mostrará cuánto debería haber. Cuenta tu dinero real e ingrésalo. Luego, el sistema te mostrará si sobró o faltó dinero.'
  },
  {
    icon: '📊',
    title: '5. Reportes y Exportación',
    description: 'Usa el Dashboard para ver tus ganancias diarias. En "Herramientas" > "Exportación Completa", descarga un ZIP con 5 archivos Excel: Resumen de Ventas, Detalle de Productos, Gastos, Clientes y Proveedores.'
  }
];

const pdfSafeColors = {
  emerald800: '#065f46',
  emerald700: '#047857',
  emerald600: '#059669',
  emerald100: '#d1fae5',
  emerald50: '#ecfdf5',
  gray800: '#1f2937',
  gray600: '#4b5563',
  gray500: '#6b7280',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue800: '#1e40af',
  white: '#ffffff',
  emeraldBorder: '#d1fae5',
  grayBorder: '#f3f4f6'
};

const HowToUseSystem: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  // Descargar tutorial como PDF
  const handleDownloadPDF = async () => {
    if (!ref.current) return;

    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);

      const pdfWidth = pageWidth * 0.90; // 90% width
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 100, 80);
      pdf.text('Guía de Usuario - BodegApp', pageWidth / 2, 40, { align: 'center' });

      // Add image containing steps
      pdf.addImage(imgData, 'PNG', (pageWidth - pdfWidth) / 2, 60, pdfWidth, pdfHeight);

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text('Generado automáticamente por BodegApp', pageWidth / 2, pageHeight - 20, { align: 'center' });

      pdf.save('guia-usuario-bodegapp.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Ocurrió un error al generar el PDF. Por favor intenta nuevamente.");
    }
  };


  return (
    <div className="mt-8">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-lg font-bold" style={{ color: pdfSafeColors.emerald800 }}>Manual Rápido</h3>
        <button
          onClick={handleDownloadPDF}
          className="text-sm px-3 py-1.5 rounded-lg hover:opacity-80 transition font-semibold flex items-center gap-2"
          style={{
            backgroundColor: pdfSafeColors.emerald100,
            color: pdfSafeColors.emerald700
          }}
        >
          <span>📄</span> Descargar PDF
        </button>
      </div>

      <div ref={ref} className="bg-white p-6 rounded-2xl shadow-sm border max-w-2xl mx-auto" style={{ borderColor: pdfSafeColors.emerald100 }}>
        <div className="text-center mb-6 border-b pb-4" style={{ borderColor: pdfSafeColors.grayBorder }}>
          <h2 className="text-2xl font-black mb-2" style={{ color: pdfSafeColors.emerald600 }}>BodegApp</h2>
          <p className="text-sm" style={{ color: pdfSafeColors.gray500 }}>Guía de Operaciones Básicas</p>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl border"
                style={{
                  backgroundColor: pdfSafeColors.emerald50,
                  borderColor: pdfSafeColors.emeraldBorder
                }}
              >
                {step.icon}
              </div>
              <div>
                <h4 className="font-bold text-base mb-1" style={{ color: pdfSafeColors.gray800 }}>{step.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: pdfSafeColors.gray600 }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-8 p-4 rounded-xl border text-sm"
          style={{
            backgroundColor: pdfSafeColors.blue50,
            borderColor: pdfSafeColors.blue100,
            color: pdfSafeColors.blue800
          }}
        >
          <p className="font-bold mb-1">💡 Tip Profesional:</p>
          <p>Realiza cortes de caja parciales si tienes mucho efectivo acumulado para mayor seguridad.</p>
        </div>
      </div>
    </div>
  );
};

export default HowToUseSystem;
