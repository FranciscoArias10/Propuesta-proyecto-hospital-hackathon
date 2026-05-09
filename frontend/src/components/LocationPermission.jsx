import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ShieldCheck, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const LocationPermission = ({ onPermissionGranted, onSkip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLoading(false);
        onPermissionGranted(coords);
      },
      (err) => {
        setLoading(false);
        let msg = "No pudimos obtener tu ubicación.";
        if (err.code === 1) msg = "Acceso denegado. Por favor, habilita los permisos en tu navegador.";
        setError(msg);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center relative overflow-hidden px-4 py-10 font-sans">
      
      {/* Gradients decorativos */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10 text-center"
      >
        {/* Icono Principal */}
        <div className="relative mb-8 flex justify-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
          />
          <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10">
            <MapPin size={48} className="text-white" />
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center z-20"
          >
            <ShieldCheck size={20} className="text-emerald-400" />
          </motion.div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Activa tu Ubicación</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Para recomendarte el hospital más cercano en <span className="text-emerald-400 font-medium">Milagro, Guayaquil o Quito</span> y calcular rutas exactas, necesitamos saber dónde te encuentras.
        </p>

        {/* Beneficios */}
        <div className="grid grid-cols-1 gap-4 mb-10 text-left">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="mt-1 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Navigation size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Hospitales Cercanos</h4>
              <p className="text-xs text-slate-500">Filtramos automáticamente la red médica según tu ciudad.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="mt-1 p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Ruta de Emergencia</h4>
              <p className="text-xs text-slate-500">Trazamos el camino más rápido en caso de urgencia vital.</p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-4">
          <motion.button
            onClick={requestLocation}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              loading 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/30'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                Permitir Acceso
                <ChevronRight size={22} />
              </>
            )}
          </motion.button>

          <button 
            onClick={onSkip}
            disabled={loading}
            className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Continuar sin ubicación
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 justify-center"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-12 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Privacidad Protegida • Solo uso médico
        </p>
      </motion.div>
    </div>
  );
};

export default LocationPermission;
