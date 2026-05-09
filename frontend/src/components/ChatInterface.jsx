import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, Mic, Volume2, VolumeX, Settings2, AlertTriangle } from 'lucide-react';
import UmbrellaLogo from './UmbrellaLogo';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = ({ onChecklistUpdate, onHospitalesUpdate, onRutaSolicitada, onHospitalSelected, onEspecialidadUpdate, tipoSeguro, onCambiarSeguro, userLocation }) => {
  const saludoInicial = tipoSeguro
    ? `¡Hola! Soy Agent_Umbrella. Veo que tienes un seguro de ${tipoSeguro.titulo}. ¿Que malestar o sintoma tienes hoy? Te ayudare a encontrar la mejor opcion economica en la red de hospitales.`
    : '¡Hola! Soy Agent_Umbrella. ¿Que malestar tienes hoy? Te ayudare a encontrar la mejor opcion economica en nuestra red de hospitales.';

  const [messages, setMessages] = useState([
    { id: 1, text: saludoInicial, sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  
  const messagesEndRef   = useRef(null);
  const recognitionRef   = useRef(null);
  const transcriptRef    = useRef("");
  const latestSettingsRef = useRef({ voiceEnabled: true, selectedVoiceURI: "", voices: [] });
  const sendMessageRef   = useRef(null);
  // Ref que guarda los hospitales más recientes para detección por texto
  const knownHospitalesRef = useRef([]);

  useEffect(() => {
    latestSettingsRef.current = { voiceEnabled, selectedVoiceURI, voices };
  }, [voiceEnabled, selectedVoiceURI, voices]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mantener el ref siempre apuntando a la función más reciente (evita stale closure en el micrófono)
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  // Load Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('es'));
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        // Try to find a good default (Google español or Sabina/Monica etc)
        const defaultVoice = availableVoices.find(v => v.name.includes('Google') || v.name.includes('Sabina')) || availableVoices[0];
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  // Setup Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          transcriptRef.current = finalTranscript;
          setInputValue(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // Usamos el ref para evitar el stale closure de sendMessage
        if (transcriptRef.current.trim()) {
          sendMessageRef.current?.(transcriptRef.current);
          transcriptRef.current = "";
        }
      };
    }
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    try {
      setInputValue("");
      transcriptRef.current = "";
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.log("Recognition already started");
    }
  };

  const speakMessage = (text, shouldAutoStartMic = true) => {
    const settings = latestSettingsRef.current;
    if (!settings.voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (settings.selectedVoiceURI) {
      const voice = settings.voices.find(v => v.voiceURI === settings.selectedVoiceURI);
      if (voice) utterance.voice = voice;
    } else {
      utterance.lang = 'es-ES';
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Auto-activar el micrófono cuando termine de hablar, a menos que sea el final
    utterance.onend = () => {
      if (latestSettingsRef.current.voiceEnabled && shouldAutoStartMic) {
        startRecording();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startInitialVoice = () => {
    setHasInteracted(true);
    speakMessage(messages[0].text);
  };

  const toggleRecording = () => {
    if (!hasInteracted) setHasInteracted(true);
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      startRecording();
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    transcriptRef.current = "";
    setIsLoading(true);

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // ── Detectar si el usuario mencionó un hospital por nombre en el texto ──
    // Se hace ANTES del fetch para que el mapa aparezca mientras el bot responde.
    if (knownHospitalesRef.current.length > 0 && onHospitalSelected) {
      const textLC = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const mentioned = knownHospitalesRef.current.find(h => {
        const name = h.hospital.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // 1. Coincidencia exacta del nombre completo
        if (textLC.includes(name)) return true;
        // 2. Coincidencia por palabras propias (>=5 letras, ignorando abreviaturas como "hosp." o "gral.")
        const nameWords = name.split(/[\s.,]+/).filter(w => w.length >= 5);
        // Si alguna palabra propia del hospital aparece en el texto del usuario → match
        return nameWords.length > 0 && nameWords.some(w => textLC.includes(w));
      });
      if (mentioned) {
        onHospitalSelected(mentioned);
      }
    }

    try {
      const historyToSend = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: historyToSend,
          tipoSeguro: tipoSeguro ? { id: tipoSeguro.id, titulo: tipoSeguro.titulo } : null,
          userLocation: userLocation,
        }),
      });

      if (!response.ok) {
        const err = new Error('Network response was not ok');
        err.status = response.status;
        throw err;
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now(),
        text: data.response,
        sender: 'bot',
        datos_hospitales: data.datos_hospitales
      }]);
      
      // Detectar si el usuario se está despidiendo o agradeciendo para no encender el micro después
      const isEnding = /(gracias|no necesito nada|eso es todo|adiós|adios|nada más|nada mas|chao|ninguno|listo)/i.test(text);

      // Hablar la respuesta si la voz está activa (y encender el micro solo si no terminó la conversación)
      speakMessage(data.response, !isEnding);

      // Activar/desactivar el botón de emergencia según el flag del backend
      if (data.is_emergency === true) {
        setIsEmergency(true);
      } else {
        setIsEmergency(false);
      }

      if (data.checklist && onChecklistUpdate) {
        onChecklistUpdate(data.checklist);
      }
      if (data.datos_hospitales && onHospitalesUpdate) {
        // Acumular hospitales de todas las respuestas (deduplicados por nombre)
        // para que la detección por texto funcione con cualquier hospital mencionado antes.
        const existing = knownHospitalesRef.current;
        const newOnes  = data.datos_hospitales.filter(
          h => !existing.some(e => e.hospital === h.hospital)
        );
        knownHospitalesRef.current = [...existing, ...newOnes];
        onHospitalesUpdate(data.datos_hospitales, data.especialidad);
      }
      if (data.especialidad && onEspecialidadUpdate) {
        onEspecialidadUpdate(data.especialidad);
      }
    } catch (error) {
      console.error('Error:', error);
      let errorText = "Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo en unos momentos.";
      
      // Intentar leer el cuerpo de la respuesta de error
      if (error?.message?.includes('429') || error?.status === 429) {
        errorText = "⏳ El servicio de inteligencia artificial está momentáneamente saturado (límite de uso alcanzado). Por favor espera unos minutos e intenta de nuevo.";
      } else if (!navigator.onLine) {
        errorText = "📡 Sin conexión a internet. Verifica tu red e intenta de nuevo.";
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        text: errorText,
        sender: 'bot'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeleccionarHospital = (msgId, hospital) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, hideChips: true } : m));
    const userMsg = { id: Date.now(), text: `🏥 Elegí el ${hospital.hospital}`, sender: 'user' };
    const botMsg = {
      id: Date.now() + 1,
      text: '¡Excelente elección! Acabo de trazar la ruta más rápida hacia el hospital desde tu ubicación actual. Puedes verla tocando "Mi Cobertura" → "Red de Hospitales".',
      sender: 'bot'
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
    speakMessage(botMsg.text, false);
    // Notificar al padre para marcar en mapa y trazar ruta
    if (onHospitalSelected) onHospitalSelected(hospital);
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {!hasInteracted && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 p-8 rounded-3xl border border-emerald-500/30 text-center max-w-sm"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mic className="text-emerald-400 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Asistente por Voz</h3>
            <p className="text-slate-400 mb-6">Haz clic para iniciar la conversación y escuchar al bot.</p>
            <button 
              onClick={startInitialVoice}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-emerald-500/30 w-full"
            >
              Iniciar Conversación
            </button>
          </motion.div>
        </div>
      )}

      <div className="p-4 flex items-center justify-between gap-3 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-white/20 shadow-[0_0_15px_rgba(238,43,46,0.3)]">
            <UmbrellaLogo size={40} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Agent_Umbrella</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              En línea
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Emergency Button — visible SOLO cuando el backend detecta emergencia */}
          <AnimatePresence>
            {isEmergency && (
              <motion.a
                href="tel:911"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold shadow-lg shadow-red-600/40 transition-colors mr-2 cursor-pointer select-none"
                title="Llamar al 911 ahora"
                role="button"
              >
                <AlertTriangle size={18} className="animate-pulse" />
                <span className="text-sm md:text-base hidden sm:inline">LLAMAR 911</span>
              </motion.a>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-full transition-colors"
              title="Configurar Voz"
            >
              <Settings2 size={20} />
            </button>
            
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-4"
                >
                  <h4 className="text-sm font-semibold text-white mb-3">Voz del Asistente</h4>
                  {voices.length === 0 ? (
                    <p className="text-xs text-slate-400">Cargando voces o no disponibles en este navegador...</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {voices.map(v => (
                        <button
                          key={v.voiceURI}
                          onClick={() => {
                            setSelectedVoiceURI(v.voiceURI);
                            setShowSettings(false);
                            // Pequeña prueba de voz al seleccionar
                            const u = new SpeechSynthesisUtterance("Voz seleccionada");
                            u.voice = v;
                            window.speechSynthesis.speak(u);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedVoiceURI === v.voiceURI 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) window.speechSynthesis.cancel();
            }}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-full transition-colors"
            title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 md:space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full flex justify-center`}
            >
              <div className={`flex gap-2 md:gap-4 w-full max-w-5xl ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center mt-1 md:mt-0 overflow-hidden ${
                  msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'border border-white/30 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                }`}>
                  {msg.sender === 'user' ? <User size={20} /> : <UmbrellaLogo size={40} />}
                </div>
                
                <div
                  className={`p-3 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm flex-1 ${
                    msg.sender === 'user'
                      ? 'bg-slate-800/40 text-slate-200 rounded-tr-sm border border-slate-700/30'
                      : 'bg-transparent text-slate-200'
                  }`}
                >
                  {/* Renderizamos el texto de manera que respete los saltos de línea */}
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                  
                  {/* CHOICE CHIPS PARA HOSPITALES */}
                  {msg.sender === 'bot' && msg.datos_hospitales && msg.datos_hospitales.length > 0 && !msg.hideChips && (
                    <div className="mt-4 flex flex-wrap gap-2 pointer-events-auto">
                      {msg.datos_hospitales.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => handleSeleccionarHospital(msg.id, h)}
                          className="bg-slate-800 hover:bg-emerald-600/80 border border-emerald-500/30 text-emerald-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md active:scale-95"
                        >
                          {h.hospital}
                        </button>
                      ))}
                    </div>
                  )}


                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex justify-center"
            >
              <div className="flex gap-2 md:gap-4 w-full max-w-5xl">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/30 flex items-center justify-center shrink-0 mt-1 md:mt-0 shadow-[0_0_10px_rgba(239,68,68,0.5)] overflow-hidden">
                  <UmbrellaLogo size={40} />
                </div>
                <div className="p-4 rounded-2xl bg-transparent text-slate-200 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-emerald-400" />
                  <span className="text-sm md:text-base text-slate-400">Analizando cobertura y opciones...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Panel Inferior Fijo */}
      <div className="w-full flex flex-col items-center gap-2 px-4 pb-4 md:pb-8 shrink-0 pointer-events-none">
        
        {isRecording && (
          <span className="text-sm font-medium text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-400 to-blue-400 animate-pulse pointer-events-none mb-1">
            Escuchando tus síntomas...
          </span>
        )}

        {/* Text Input con Micrófono Integrado */}
        <form onSubmit={handleSend} className="w-full max-w-3xl relative flex items-center transition-all pointer-events-auto">
          <div className={`w-full bg-slate-800/95 backdrop-blur-xl rounded-full flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all duration-300 ${
            isRecording 
              ? 'border-2 border-emerald-500 shadow-[0_0_30px_rgba(52,211,153,0.3)]' 
              : 'border border-slate-600/50 focus-within:border-emerald-500/50'
          }`}>
            
            {/* Botón de Micrófono */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`ml-2 p-2.5 md:p-3 rounded-full transition-colors shrink-0 ${
                isRecording 
                  ? 'text-white bg-linear-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' 
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50'
              }`}
              title={isRecording ? "Detener" : "Hablar por micrófono"}
            >
              <Mic size={22} className={isRecording ? 'animate-pulse' : ''} />
            </button>

            {/* Input de Texto */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? "Habla ahora..." : "Escribe tu síntoma o toca el micrófono..."}
              className="w-full bg-transparent pl-3 pr-14 py-3.5 md:py-4 text-sm md:text-base text-white focus:outline-none placeholder:text-slate-400"
              disabled={isLoading || isRecording}
            />
            
            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 p-2 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} className="translate-x-px translate-y-px" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
