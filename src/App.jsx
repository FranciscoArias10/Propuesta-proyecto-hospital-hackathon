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

      <div className="relative z-10 w-full h-screen flex flex-col overflow-hidden">
        
        <div className="flex-1 w-full relative flex flex-col min-h-0">
          
          {/* Chat Interface */}
          <div className="flex-1 relative flex flex-col min-h-0">
            <ChatInterface onChecklistUpdate={updateChecklist} />
          </div>

          {/* Floating Draggable Checklist */}
          <AnimateChecklist checklistData={checklistData} />

        </div>

      </div>
    </div>
  );
}

const AnimateChecklist = ({ checklistData }) => {
  if (!checklistData) return null;

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, x: 20, y: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      className="absolute top-4 right-4 z-50 w-72 md:w-80 bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-900/40 cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      {/* Drag Handle Area */}
      <div className="w-full h-8 flex items-center justify-center border-b border-slate-700/50 mb-2 opacity-60 hover:opacity-100 transition-opacity">
        <div className="w-12 h-1.5 bg-slate-500 rounded-full" />
      </div>

      <div className="p-5 pt-1">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 select-none">
          <CreditCard className="text-emerald-400" size={20} />
          {checklistData.nombre}
        </h3>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
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
                className="flex items-start gap-3 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50 select-none"
              >
                <div className="mt-0.5 p-1 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Icon size={16} />
                </div>
                <span className="text-sm text-slate-200 pointer-events-auto">{paso.text}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default App;
