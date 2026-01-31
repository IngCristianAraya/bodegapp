'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { getStoreSettings, updateStoreSettings, StoreSettings } from '../../lib/supabaseSettings';
import { useToast } from '../../contexts/ToastContext';
import { Save, Store, MapPin, Phone, Mail, FileText, Image as ImageIcon, Loader2, Lock, Shield, DollarSign } from 'lucide-react';

import Image from 'next/image';

import BackupManager from './BackupManager';

const SettingsPanel: React.FC = () => {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettings | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            if (!tenant?.id) return;
            try {
                const data = await getStoreSettings(tenant.id);
                if (data) {
                    setSettings(data);
                } else {
                    // Pre-poblar con datos básicos del tenant
                    setSettings({
                        tenant_id: tenant.id,
                        business_name: tenant.name,
                        email: '',
                        address: '',
                        phone: '',
                        ruc: '',
                        ticket_footer: '¡Gracias por su compra!'
                    });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                showToast('Error al cargar la configuración', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [tenant, showToast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant?.id || !settings) return;

        setSaving(true);
        try {
            console.log('SettingsPanel: Persisting settings to Supabase...', {
                tenant_id: tenant.id,
                settings
            });
            await updateStoreSettings(tenant.id, settings);
            showToast('Configuración guardada correctamente', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Error al guardar la configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'BODEGAPP');

        try {
            setSaving(true);
            const res = await fetch('https://api.cloudinary.com/v1_1/dyhgwvz8b/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                setSettings((prev: StoreSettings | null) => prev ? { ...prev, logo_url: data.secure_url } : null);

                // Persistencia inmediata del logo
                if (tenant?.id) {
                    console.log('SettingsPanel: Auto-saving logo...', data.secure_url);
                    await updateStoreSettings(tenant.id, { logo_url: data.secure_url });
                }

                showToast('Logo subido y guardado correctamente', 'success');
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            showToast('Error al procesar el logo', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'yape' | 'plin') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'BODEGAPP');

        try {
            setSaving(true);
            const res = await fetch('https://api.cloudinary.com/v1_1/dyhgwvz8b/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                const update = type === 'yape' ? { yape_qr_url: data.secure_url } : { plin_qr_url: data.secure_url };
                setSettings((prev: StoreSettings | null) => prev ? { ...prev, ...update } : null);

                // Persistencia inmediata
                if (tenant?.id) {
                    await updateStoreSettings(tenant.id, update);
                }
                showToast(`QR de ${type.toUpperCase()} subido correctamente`, 'success');
            }
        } catch (error) {
            console.error('Error uploading QR:', error);
            showToast('Error al procesar la imagen', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Configuración de <span className="text-emerald-500">Tienda</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Personaliza el branding y los datos de tu bodega.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 font-bold"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Branding Card */}
                <div className="lg:col-span-1">
                    <div className="glass-card bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-white/20 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Identidad Visual</h2>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 transition-colors group-hover:border-emerald-400">
                                    {settings?.logo_url ? (
                                        <Image
                                            src={settings.logo_url}
                                            alt="Logo Preview"
                                            className="w-full h-full object-contain p-2"
                                            width={160}
                                            height={160}
                                        />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-xs text-gray-500 text-center font-medium leading-relaxed">Sube tu logo profesional</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[200px]">
                                Recomendado: PNG transparente o SVG, 512x512px.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Settings Card */}
                <div className="lg:col-span-2 space-y-8">
                    <form className="glass-card bg-white/50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-white/20 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Información General</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nombre Comercial</label>
                            <div className="relative">
                                <Store className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={settings?.business_name || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, business_name: e.target.value } : null)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="Nombre de tu negocio"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">RUC / Documento</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={settings?.ruc || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, ruc: e.target.value } : null)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="Número de RUC"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={settings?.phone || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="987 654 321"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email de contacto</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={settings?.email || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="tienda@correo.com"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Dirección Física</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={settings?.address || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, address: e.target.value } : null)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="Av. Principal 123, Los Olivos"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 border-t border-gray-100 dark:border-gray-800 my-4"></div>

                        <div className="col-span-2 flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Seguridad</h2>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Clave de Administrador (PIN)</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={settings?.admin_password || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, admin_password: e.target.value } : null)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-red-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="Clave secreta para acciones críticas"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium ml-1">Esta clave se solicitará para ajustar stock, cambiar precios o eliminar productos.</p>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">PIN de Caja (Supervisor)</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-emerald-500" />
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={settings?.admin_pin || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setSettings(prev => prev ? { ...prev, admin_pin: val } : null);
                                    }}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-mono font-bold tracking-widest"
                                    placeholder="0000"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium ml-1">PIN de 4 dígitos para autorizar Cierres de Caja y visualizar montos reales.</p>
                        </div>

                        {/* Ticket Customization */}
                        <div className="col-span-2 pt-4 flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personalización de Tickets</h2>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Mensaje al pie del ticket</label>
                            <textarea
                                value={settings?.ticket_footer || ''}
                                onChange={(e) => setSettings(prev => prev ? { ...prev, ticket_footer: e.target.value } : null)}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 dark:text-white font-medium min-h-[100px]"
                                placeholder="Ej: ¡Gracias por su compra! Vuelva pronto."
                            />
                        </div>
                    </form>

                    {/* Payment Types Section */}
                    <form className="glass-card bg-white/50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-white/20 shadow-xl space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Medios de Pago Digitales</h2>
                                <p className="text-xs text-gray-400">Configura tus QRs para agilizar el cobro</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Yape Config */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs">Y</div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Yape</h3>
                                </div>

                                <div className="relative group">
                                    <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 transition-colors group-hover:border-purple-400 relative">
                                        {settings?.yape_qr_url ? (
                                            <>
                                                <Image
                                                    src={settings.yape_qr_url}
                                                    alt="Yape QR"
                                                    className="w-full h-full object-cover p-2"
                                                    width={200}
                                                    height={200}
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs font-bold">Cambiar QR</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500 text-center font-medium">Subir QR de Yape</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleQrUpload(e, 'yape')}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Número asociado</label>
                                    <input
                                        type="tel"
                                        value={settings?.yape_number || ''}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, yape_number: e.target.value } : null)}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-gray-900 dark:text-white font-medium text-sm"
                                        placeholder="999 999 999"
                                    />
                                </div>
                            </div>

                            {/* Plin Config */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-xs">P</div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Plin</h3>
                                </div>

                                <div className="relative group">
                                    <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 transition-colors group-hover:border-sky-400 relative">
                                        {settings?.plin_qr_url ? (
                                            <>
                                                <Image
                                                    src={settings.plin_qr_url}
                                                    alt="Plin QR"
                                                    className="w-full h-full object-cover p-2"
                                                    width={200}
                                                    height={200}
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs font-bold">Cambiar QR</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500 text-center font-medium">Subir QR de Plin</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleQrUpload(e, 'plin')}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Número asociado</label>
                                    <input
                                        type="tel"
                                        value={settings?.plin_number || ''}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, plin_number: e.target.value } : null)}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 outline-none transition-all text-gray-900 dark:text-white font-medium text-sm"
                                        placeholder="999 999 999"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Backup Section */}
                    <BackupManager />

                    {/* Preview Section */}
                    <div className="glass-card bg-slate-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText size={120} />
                        </div>
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Vista Previa del Ticket
                        </h3>
                        <div className="bg-white p-4 mx-auto max-w-[280px] text-gray-900 font-mono text-xs shadow-inner rounded-sm">
                            <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                                {settings?.logo_url ? (
                                    <Image src={settings.logo_url} alt="Logo" className="mx-auto h-8 object-contain mb-2" width={60} height={32} />
                                ) : (
                                    <span className="font-bold text-sm block mb-1">LOGO AQUÍ</span>
                                )}
                                <span className="font-bold block uppercase">{settings?.business_name || 'BODEGAPP'}</span>
                                {settings?.ruc && <span>RUC: {settings.ruc}</span>}
                            </div>
                            <div className="space-y-1 mb-3">
                                <div className="flex justify-between"><span>Prod 1</span><span>S/ 10.00</span></div>
                                <div className="flex justify-between font-bold pt-2 border-t border-dotted border-gray-300">
                                    <span>TOTAL:</span><span>S/ 10.00</span>
                                </div>
                            </div>
                            <div className="text-center border-t border-dashed border-gray-300 pt-3 italic text-[10px]">
                                {settings?.ticket_footer || '¡Gracias por su compra!'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
