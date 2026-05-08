import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Mic, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = ({ onChecklistUpdate }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "¡Hola! Soy tu Estimador Agéntico. ¿Qué malestar tienes hoy? Te ayudaré a encontrar la mejor opción económica en nuestra red de hospitales.", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        // Auto-enviar si hay texto reconocido
        if (transcriptRef.current.trim()) {
          sendMessage(transcriptRef.current);
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
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Cancel previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    } else {
      utterance.lang = 'es-ES';
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Auto-activar el micrófono cuando termine de hablar, a menos que sea el final
    utterance.onend = () => {
      if (voiceEnabled && shouldAutoStartMic) {
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now(),
        text: data.response,
        sender: 'bot'
      }]);
      
      // Detectar si el usuario se está despidiendo o agradeciendo para no encender el micro después
      const isEnding = /(gracias|no necesito nada|eso es todo|adiós|adios|nada más|nada mas|chao|ninguno|listo)/i.test(text);

      // Hablar la respuesta si la voz está activa (y encender el micro solo si no terminó la conversación)
      speakMessage(data.response, !isEnding);

      if (data.checklist && onChecklistUpdate) {
        onChecklistUpdate(data.checklist);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "Lo siento, hubo un error de conexión al estimar tu copago.",
        sender: 'bot'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <>
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

      <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Asistente de Cobertura</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              En línea
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'
              }`}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div
                className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                }`}
              >
                {/* Renderizamos el texto de manera que respete los saltos de línea */}
                {msg.text.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[85%]"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-emerald-400" />
                <span className="text-sm text-slate-400">Calculando cobertura...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col items-center gap-4 relative z-20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]">
        {/* Big Mic Button */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={toggleRecording}
            className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-2xl ${
              isRecording 
                ? 'bg-red-500 text-white scale-110 shadow-red-500/50' 
                : 'bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 shadow-emerald-500/30'
            }`}
            title={isRecording ? "Detener" : "Hablar"}
          >
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></span>
                <span className="absolute inset-[-20px] rounded-full border-2 border-red-500/30 animate-pulse"></span>
              </>
            )}
            <Mic size={40} className={isRecording ? 'animate-bounce' : ''} />
          </button>
          <span className={`mt-3 text-sm font-medium transition-colors ${isRecording ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {isRecording ? "Escuchando tus síntomas..." : "Toca el micrófono para hablar"}
          </span>
        </div>

        {/* Text Input (Secondary) */}
        <form onSubmit={handleSend} className="w-full max-w-lg relative flex items-center mt-2 opacity-80 hover:opacity-100 transition-opacity">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="O si prefieres, escribe tu síntoma aquí..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-full pl-5 pr-14 py-3 text-sm text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-500"
            disabled={isLoading || isRecording}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-1.5 p-2 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} className="translate-x-[1px] translate-y-[1px]" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatInterface;
