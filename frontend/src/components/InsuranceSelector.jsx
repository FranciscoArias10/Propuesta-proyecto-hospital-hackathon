import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, UserCircle, Leaf, ShieldOff,
  ChevronRight, HeartPulse, CheckCircle2
} from 'lucide-react';

const SEGUROS = [
  {
    id: 'dependencia',
    titulo: 'Relación de Dependencia',
    subtitulo: 'Afiliado al IESS como trabajador en empresa privada o pública',
    descripcion: 'Cobertura IESS obligatoria · Copago reducido · Red hospitalaria completa',
    icon: Briefcase,
    color: 'emerald',
    gradient: 'from-emerald-600/20 to-teal-600/10',
    border: 'border-emerald-500/40',
    hover: 'hover:border-emerald-400/70 hover:bg-emerald-500/10',
    selected: 'border-emerald-400 bg-emerald-500/15',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    id: 'independiente',
    titulo: 'Independiente',
    subtitulo: 'Trabajador autónomo o freelance con IESS Voluntario',
    descripcion: 'Afiliación voluntaria · Planes flex · Períodos de espera aplicables',
    icon: UserCircle,
    color: 'blue',
    gradient: 'from-blue-600/20 to-cyan-600/10',
    border: 'border-blue-500/40',
    hover: 'hover:border-blue-400/70 hover:bg-blue-500/10',
    selected: 'border-blue-400 bg-blue-500/15',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'campesino',
    titulo: 'Seguro Social Campesino',
    subtitulo: 'Productor agrícola o pescador artesanal con cobertura SSC',
    descripcion: 'Cobertura básica · Enfocado en atención rural · Copago mínimo',
    icon: Leaf,
    color: 'lime',
    gradient: 'from-lime-600/20 to-green-600/10',
    border: 'border-lime-500/40',
    hover: 'hover:border-lime-400/70 hover:bg-lime-500/10',
    selected: 'border-lime-400 bg-lime-500/15',
    iconBg: 'bg-lime-500/20 text-lime-400',
  },
  {
    id: 'sin_seguro',
    titulo: 'Sin Seguro',
    subtitulo: 'Paciente particular sin cobertura de seguro social',
    descripcion: 'Pago directo · Opciones económicas · Guía de precios reales',
    icon: ShieldOff,
    color: 'orange',
    gradient: 'from-orange-600/20 to-amber-600/10',
    border: 'border-orange-500/40',
    hover: 'hover:border-orange-400/70 hover:bg-orange-500/10',
    selected: 'border-orange-400 bg-orange-500/15',
    iconBg: 'bg-orange-500/20 text-orange-400',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

const InsuranceSelector = ({ onSelect }) => {
  const [selected, setSelected] = useState(null);

  const confirm = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center relative overflow-hidden px-4 py-10 font-sans">

      {/* Gradients decorativos */}
      <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-emerald-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-teal-900/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <HeartPulse className="text-emerald-400" size={26} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Asistente de Cobertura IESS</h1>
        </div>
        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
          Antes de comenzar, dinos <strong className="text-slate-200">cuál es tu tipo de seguro</strong>.<br />
          Así podremos calcular tu copago con precisión.
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl relative z-10"
      >
        {SEGUROS.map((s) => {
          const Icon = s.icon;
          const isSelected = selected?.id === s.id;

          return (
            <motion.button
              key={s.id}
              variants={cardAnim}
              onClick={() => setSelected(s)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative text-left p-5 rounded-2xl border bg-gradient-to-br ${s.gradient} transition-all duration-200 ${
                isSelected ? s.selected : `bg-slate-900/60 ${s.border} ${s.hover}`
              }`}
            >
              {/* Checkmark */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-4 right-4"
                  >
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                <Icon size={22} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">{s.titulo}</h3>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">{s.subtitulo}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.descripcion}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Confirm button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 relative z-10 w-full max-w-2xl"
      >
        <motion.button
          onClick={confirm}
          disabled={!selected}
          whileHover={selected ? { scale: 1.02 } : {}}
          whileTap={selected ? { scale: 0.98 } : {}}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all ${
            selected
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {selected ? (
            <>
              Continuar con {selected.titulo}
              <ChevronRight size={18} />
            </>
          ) : (
            'Selecciona tu tipo de seguro para continuar'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default InsuranceSelector;
