import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Building, Stethoscope, MapPin,
  X, Activity, ShieldCheck, CircleDollarSign, ChevronRight
} from 'lucide-react';
import HospitalMap from './HospitalMap';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const planColor = (plan) => {
  if (!plan) return 'bg-slate-700 text-slate-300';
  const p = plan.toLowerCase();
  if (p.includes('oro') || p.includes('gold')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
  if (p.includes('plata') || p.includes('plat')) return 'bg-slate-400/20 text-slate-200 border border-slate-400/40';
  if (p.includes('público') || p.includes('publico')) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
  return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
};

/* ── Panel Principal (pantalla completa) ──────────────────────────────────── */
const SidePanel = ({
  checklistData,
  hospitales,
  userLocation,
  targetHospital,
  onSelectHospital,
  panelCommand,
}) => {
  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState('copago');
  const autoCloseRef              = useRef(null);

  const hasData = checklistData || hospitales.length > 0;

  // Cierra el panel y cancela el auto-close
  const closePanel = () => {
    clearTimeout(autoCloseRef.current);
    setIsOpen(false);
  };

  // Cuando llega panelCommand: abrir, cambiar tab y cerrar tras 4 s (flash)
  useEffect(() => {
    if (!panelCommand) return;
    clearTimeout(autoCloseRef.current);
    setActiveTab(panelCommand.tab || 'red');
    setIsOpen(true);
    autoCloseRef.current = setTimeout(() => setIsOpen(false), 20000);
    return () => clearTimeout(autoCloseRef.current);
  }, [panelCommand]);

  return (
    <>
      {/* ── Botón flotante ── */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-20 right-5 z-40 flex items-center gap-2 bg-slate-800/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-full shadow-lg shadow-emerald-900/30 text-sm font-medium"
        style={{ touchAction: 'none' }}
      >
        <Activity size={16} className="text-emerald-400" />
        <span>Mi Cobertura</span>
        {hasData && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        <ChevronRight size={15} />
      </motion.button>

      {/* ── Modal pantalla completa ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay — clic cierra y cancela timer */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={closePanel}
            />

            {/* Panel */}
            <motion.div
              key="fullscreen-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-slate-700/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <ShieldCheck className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Mi Cobertura</h2>
                    <p className="text-xs text-slate-500">Toca fuera del panel para cerrar</p>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 px-5 md:px-8 pt-4 pb-2 shrink-0">
                {[
                  { id: 'copago', label: 'Estimación de Copago', icon: CreditCard },
                  { id: 'red',    label: 'Red de Hospitales',    icon: MapPin },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      clearTimeout(autoCloseRef.current); // Interacción manual cancela el auto-close
                      setActiveTab(id);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-900/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div className="flex-1 min-h-0 overflow-hidden px-5 md:px-8 pb-6">
                <AnimatePresence mode="wait">

                  {/* TAB: Estimación de Copago */}
                  {activeTab === 'copago' && (
                    <motion.div
                      key="copago"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="h-full overflow-y-auto pt-3"
                    >
                      {!checklistData ? (
                        <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Stethoscope size={32} className="text-emerald-500/50" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-slate-300 mb-1">Sin datos aún</p>
                            <p className="text-sm text-slate-500 max-w-sm">
                              Cuéntale tus síntomas al asistente para generar tu estimación de copago personalizada.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-2xl mx-auto space-y-3 pb-6">
                          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">
                            {checklistData.nombre}
                          </h3>
                          {checklistData.pasos.map((paso, idx) => {
                            let Icon = Building;
                            const t = paso.text.toLowerCase();
                            if (t.includes('especialidad')) Icon = Stethoscope;
                            if (t.includes('copago'))       Icon = CircleDollarSign;
                            if (t.includes('opción') || t.includes('hospital')) Icon = Building;

                            return (
                              <motion.div
                                key={paso.id}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.07 }}
                                className="flex items-start gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/40"
                              >
                                <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                                  <Icon size={18} />
                                </div>
                                <span className="text-sm md:text-base text-slate-200 leading-relaxed">{paso.text}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB: Red de Hospitales */}
                  {activeTab === 'red' && (
                    <motion.div
                      key="red"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row gap-4 h-full pt-3"
                    >
                      {/* Mapa */}
                      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700/50 min-h-[280px]">
                        <HospitalMap
                          hospitales={hospitales}
                          userLocation={userLocation}
                          targetHospital={targetHospital}
                        />
                      </div>

                      {/* Lista */}
                      <div className="w-full md:w-80 flex flex-col min-h-0">
                        {hospitales.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
                            <MapPin size={28} className="text-blue-500/40" />
                            <p className="text-sm text-slate-400">
                              Describe tus síntomas para ver la red de hospitales disponibles.
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-500 mb-2 shrink-0">
                              {hospitales.length} hospitales · Selecciona uno para marcarlo en el mapa
                            </p>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                              {hospitales.map((h, i) => {
                                const copago = Math.round((1 - h.cobertura) * (h.costoBase || 0));
                                const isSelected = targetHospital && targetHospital.hospital === h.hospital;

                                return (
                                  <motion.button
                                    key={i}
                                    onClick={() => onSelectHospital && onSelectHospital(h)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                                      isSelected
                                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                                        : 'bg-slate-800/60 border-slate-700/40 hover:border-blue-500/40 hover:bg-slate-800'
                                    }`}
                                  >
                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                      <Building size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                                          {isSelected && '✓ '}{h.hospital}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${planColor(h.plan)}`}>
                                          {h.plan}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-400 mt-0.5">{h.especialidad}</p>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs text-slate-300">
                                          Cobertura: <strong className="text-emerald-400">{Math.round(h.cobertura * 100)}%</strong>
                                        </span>
                                        <span className="text-xs text-slate-300">
                                          Copago: <strong className={copago === 0 ? 'text-emerald-400' : 'text-yellow-300'}>${copago}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SidePanel;
