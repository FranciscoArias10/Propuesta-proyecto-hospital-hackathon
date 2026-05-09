import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import InsuranceSelector from './components/InsuranceSelector';
import ChatInterface from './components/ChatInterface';
import SidePanel from './components/SidePanel';
import LocationPermission from './components/LocationPermission';

function App() {
  const [locationHandled, setLocationHandled]   = useState(false);
  const [tipoSeguro, setTipoSeguro]             = useState(null);
  const [checklistData, setChecklistData]       = useState(null);
  const [hospitales, setHospitales]             = useState([]);
  const [userLocation, setUserLocation]         = useState(null);
  const [targetHospital, setTargetHospital]     = useState(null);
  const [panelCommand, setPanelCommand]         = useState(null);

  const handleLocationGranted = (coords) => {
    setUserLocation(coords);
    setLocationHandled(true);
  };

  const handleSkipLocation = () => {
    setLocationHandled(true);
  };

  const handleSelectSeguro = (seguro) => {
    setTipoSeguro(seguro);
  };

  const updateChecklist = (newChecklist) => {
    if (newChecklist) setChecklistData(newChecklist);
  };

  const updateHospitales = (data, especialidad) => {
    if (!data || data.length === 0) return;

    if (especialidad) {
      const exactMatch = data.filter(
        h => h.especialidad?.toLowerCase() === especialidad.toLowerCase()
      );
      if (exactMatch.length > 0) { setHospitales(exactMatch); return; }

      const medGeneral = data.filter(
        h => h.especialidad?.toLowerCase().includes('medicina general')
      );
      if (medGeneral.length > 0) { setHospitales(medGeneral); return; }

      const unique = [...new Map(data.map(h => [h.hospital, h])).values()].slice(0, 7);
      setHospitales(unique);
    } else {
      setHospitales(data);
    }
  };

  const handleRutaSolicitada = (loc, hosp) => {
    setUserLocation(loc);
    setTargetHospital(hosp);
  };

  const handleHospitalSelectedFromChat = (hospital) => {
    setTargetHospital(hospital);
    setPanelCommand({ tab: 'red', ts: Date.now() });
  };

  const handleSelectHospitalFromPanel = (hospital) => {
    setTargetHospital(hospital);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden relative font-sans selection:bg-emerald-500/30">

      <AnimatePresence mode="wait">
        {!locationHandled ? (
          /* ── Pantalla de permisos de ubicación ── */
          <motion.div
            key="location"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <LocationPermission 
              onPermissionGranted={handleLocationGranted} 
              onSkip={handleSkipLocation} 
            />
          </motion.div>
        ) : !tipoSeguro ? (
          /* ── Pantalla de selección de seguro ── */
          <motion.div
            key="selector"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <InsuranceSelector onSelect={handleSelectSeguro} />
          </motion.div>
        ) : (
          /* ── Pantalla principal del chat ── */
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-screen flex flex-col"
          >
            {/* Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full h-screen flex flex-col overflow-hidden">
              <div className="flex-1 w-full relative flex flex-col min-h-0">

                {/* Chat Interface */}
                <div className="flex-1 relative flex flex-col min-h-0">
                  <ChatInterface
                    tipoSeguro={tipoSeguro}
                    userLocation={userLocation}
                    onChecklistUpdate={updateChecklist}
                    onHospitalesUpdate={updateHospitales}
                    onRutaSolicitada={handleRutaSolicitada}
                    onHospitalSelected={handleHospitalSelectedFromChat}
                    onEspecialidadUpdate={() => {}}
                    onCambiarSeguro={() => setTipoSeguro(null)}
                  />
                </div>

                {/* Panel lateral */}
                <SidePanel
                  checklistData={checklistData}
                  hospitales={hospitales}
                  userLocation={userLocation}
                  targetHospital={targetHospital}
                  onSelectHospital={handleSelectHospitalFromPanel}
                  panelCommand={panelCommand}
                />

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
