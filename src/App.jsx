import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { Stethoscope, ShieldCheck, CreditCard, Building } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [checklistData, setChecklistData] = useState(null);

  const updateChecklist = (newChecklist) => {
    if (newChecklist) {
      setChecklistData(newChecklist);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden relative font-sans selection:bg-emerald-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto p-4 md:p-8 h-screen flex justify-center items-center">
        
        <div className="w-full max-w-4xl flex flex-col h-[90vh]">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
              Estimador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Copago y Cobertura</span>
            </h1>
            <p className="text-slate-400">Conoce cuánto vas a pagar antes de atenderte.</p>
          </motion.div>

          {/* Centered Chat Interface */}
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl shadow-emerald-900/10 overflow-hidden relative flex flex-col">
            <ChatInterface onChecklistUpdate={updateChecklist} />
          </div>
        </div>

      </div>
    </div>
  );
}

const AnimateChecklist = ({ checklistData }) => {
  if (!checklistData) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-center h-32 flex-col gap-3 text-slate-500">
          <Stethoscope size={32} className="opacity-50" />
          <p className="text-sm text-center">Cuéntame tus síntomas para estimar tu cobertura y copago.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 shadow-lg shadow-emerald-900/20"
    >
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <CreditCard className="text-emerald-400" size={24} />
        {checklistData.nombre}
      </h3>
      <div className="space-y-4">
        {checklistData.pasos.map((paso, idx) => {
          let Icon = Building;
          if (paso.text.toLowerCase().includes('especialidad')) Icon = Stethoscope;
          if (paso.text.toLowerCase().includes('copago')) Icon = CreditCard;
          
          return (
            <motion.div 
              key={paso.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50"
            >
              <div className="mt-0.5 p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Icon size={16} />
              </div>
              <span className="text-slate-200">{paso.text}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  );
};

export default App;
