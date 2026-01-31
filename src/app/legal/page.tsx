import React from 'react';
import LandingNavbar from '@/components/Landing/LandingNavbar';
import Footer from '@/components/Landing/Footer';

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <LandingNavbar />

            <main className="flex-1 container mx-auto px-6 py-24 max-w-4xl">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">Términos y Condiciones</h1>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6 text-gray-700 dark:text-gray-300">

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar BodegApp, aceptas cumplir y estar sujeto a los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte, no debes usar nuestros servicios.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Responsabilidad de Datos</h2>
                        <p className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg">
                            <strong>Importante:</strong> BodegApp es una herramienta de gestión. Aunque implementamos medidas de seguridad estándar,
                            <strong> no nos hacemos responsables por la pérdida, corrupción o filtración de datos</strong> causados por errores del sistema, fallos de terceros, ataques cibernéticos o mal uso por parte del usuario.
                        </p>
                        <p className="mt-2">
                            Es responsabilidad exclusiva del usuario realizar <strong>Copias de Seguridad (Backups)</strong> periódicas de su información utilizando las herramientas proporcionadas por el sistema (Exportación a Excel/JSON).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Disponibilidad del Servicio</h2>
                        <p>
                            Nos esforzamos por mantener el servicio disponible 24/7, pero no garantizamos que el sistema funcione sin interrupciones o libre de errores. Nos reservamos el derecho de suspender el servicio temporalmente por mantenimiento o actualizaciones.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Privacidad</h2>
                        <p>
                            Respetamos tu privacidad. Lso datos ingresados en el sistema pertenecen a tu negocio. No vendemos ni compartimos tu información comercial con terceros sin tu consentimiento, salvo requerimiento legal.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Contacto</h2>
                        <p>
                            Para soporte técnico o dudas sobre estos términos, por favor contáctanos a través de nuestro canal oficial de WhatsApp o correo electrónico.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
