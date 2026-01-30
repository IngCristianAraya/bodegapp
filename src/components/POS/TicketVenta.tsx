
import React, { forwardRef } from 'react';
import { StoreSettings } from '@/lib/supabaseSettings';

interface TicketVentaProps {
  venta: {
    receiptNumber: string;
    cashierName: string;
    customerName?: string;
    paymentMethod: string;
    date: string;
    items: { productName: string; quantity: number; unitPrice: number }[];
    subtotal: number;
    discount: number;
    igv: number;
    total: number;
  };
  settings?: StoreSettings | null;
}

// Componente imprimible (forwardRef para react-to-print)
const TicketVenta = forwardRef<HTMLDivElement, TicketVentaProps>(({ venta, settings }, ref) => {
  // Datos prioritarios desde Supabase, fallback a genéricos
  const businessName = settings?.business_name || 'BODEGA APP';
  const ruc = settings?.ruc || '---';
  const address = settings?.address || '---';
  const logoUrl = settings?.logo_url;
  const footer = settings?.ticket_footer || '¡Gracias por su compra!';

  return (
    <div ref={ref} id="ticket-pdf-capture" style={{ width: '58mm', minHeight: 'auto', fontFamily: 'monospace', fontSize: '12px', padding: '15px 10px', margin: '0 auto', background: 'white', color: 'black' }} className="ticket-print-safe">
      {/* Header Centered with Flexbox */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '12px' }}>
        {logoUrl && (
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', width: '100%' }}>
            <img src={logoUrl} alt="Logo" style={{ maxHeight: '50px', maxWidth: '90%', objectFit: 'contain' }} />
          </div>
        )}
        <div style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', lineHeight: '1.2', marginBottom: '2px' }}>{businessName}</div>
        <div style={{ fontSize: '11px', color: '#333' }}>RUC: {ruc}</div>
        {address && <div style={{ fontSize: '11px', color: '#333' }}>{address}</div>}
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0', textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>BOLETA DE VENTA</div>
        <div style={{ fontSize: '11px' }}>N°: {venta.receiptNumber}</div>
      </div>

      <div style={{ fontSize: '10px', marginBottom: '10px', textTransform: 'uppercase' }}>
        <div className="flex justify-between"><span>FECHA:</span> <span>{venta.date}</span></div>
        <div className="flex justify-between"><span>CAJERO:</span> <span>{venta.cashierName}</span></div>
        <div className="flex justify-between"><span>PAGO:</span> <span>{['CASH', 'cash'].includes(venta.paymentMethod) ? 'EFECTIVO' : venta.paymentMethod}</span></div>
        {venta.customerName && (
          <div className="flex justify-between"><span>CLIENTE:</span> <span>{venta.customerName}</span></div>
        )}
      </div>

      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '10px', marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>CANT</th>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>PRODUCTO</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ verticalAlign: 'top', paddingTop: '4px' }}>{item.quantity}</td>
              <td style={{ verticalAlign: 'top', paddingTop: '4px', paddingRight: '4px' }}>{item.productName}</td>
              <td style={{ verticalAlign: 'top', paddingTop: '4px', textAlign: 'right' }}>{(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '11px' }}>
        <div className="flex justify-between"><span>SUBTOTAL:</span> <span>S/ {venta.subtotal.toFixed(2)}</span></div>
        {venta.discount > 0 && (
          <div className="flex justify-between" style={{ color: 'red' }}><span>DSCTO:</span> <span>-S/ {venta.discount.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between"><span>IGV:</span> <span>S/ {venta.igv.toFixed(2)}</span></div>
        <div className="flex justify-between" style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '6px', borderTop: '1px solid #000', paddingTop: '4px' }}>
          <span>TOTAL:</span> <span>S/ {venta.total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '20px', borderTop: '1px dashed #000', paddingTop: '10px', fontStyle: 'italic', lineHeight: '1.4' }}>
        {footer}
      </div>
    </div>
  );
});

TicketVenta.displayName = 'TicketVenta';
export default TicketVenta;

// --- PDF EXPORT UTIL ---
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportTicketToPDF = async () => {
  const input = document.getElementById('ticket-pdf-capture');
  if (!input) return;
  const canvas = await html2canvas(input, { useCORS: true, backgroundColor: null });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('ticket.pdf');
};

