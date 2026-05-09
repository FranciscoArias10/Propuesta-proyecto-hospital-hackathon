# 🩺 Agent_Umbrella

<p align="center">
  <img src="https://img.shields.io/badge/Estado-MVP-success?style=for-the-badge" alt="Status MVP">
  <img src="https://img.shields.io/badge/Región-Ecuador-blue?style=for-the-badge" alt="Ecuador">
  <img src="https://img.shields.io/badge/Enfoque-Salud_Pública-red?style=for-the-badge" alt="Salud">
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20Node.js-61DAFB?style=for-the-badge" alt="Stack">
  <img src="https://img.shields.io/badge/IA-Groq%20%7C%20LLaMA%203.3%2070B-orange?style=for-the-badge" alt="IA">
  <img src="https://img.shields.io/badge/DB-Supabase-3ECF8E?style=for-the-badge" alt="Supabase">
  <img src="https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge" alt="MIT">
</p>

<p align="center">
  <b>Asistente conversacional inteligente para la orientación médica y estimación de copagos en Ecuador.</b>
  <br />
  <i>Claridad y transparencia en tu salud antes de salir de casa.</i>
</p>

---

### ⚠️ Nota Importante (Disclaimer)

> **Información de Prueba:** Este proyecto es un prototipo funcional (MVP). La mayoría de los datos presentados (costos de copagos, porcentajes de cobertura y disponibilidad hospitalaria) son **ficticios** y han sido generados únicamente con el propósito de probar la lógica del sistema y realizar demostraciones técnicas. No deben tomarse como valores reales para atención médica.

---

## 📌 Descripción

**Agent_Umbrella** es una plataforma tecnológica diseñada para reducir la fricción en el acceso a la salud en Ecuador. A través de inteligencia artificial avanzada, permite a cualquier paciente entender sus beneficios médicos, estimar los costos asociados y encontrar el centro de atención más adecuado **antes de salir de casa**, facilitando una toma de decisiones rápida e informada.

---

## 🚨 La Problemática

En Ecuador, millones de pacientes enfrentan una barrera invisible al buscar atención médica:

| Problema | Impacto |
| :--- | :--- |
| **Desconocimiento de costos** | El paciente no sabe si puede costear la atención antes de ir |
| **Red de atención confusa** | No sabe qué clínicas u hospitales acepta su IESS o seguro privado |
| **Orientación médica deficiente** | No sabe a qué especialidad dirigirse según sus síntomas |
| **Demoras en emergencias** | Pérdida de tiempo crítico al no reconocer señales de alerta vitales |

---

## 💡 La Solución

Nuestra plataforma ofrece un acompañamiento integral de extremo a extremo:

- ✅ **Triaje asistido por IA:** Análisis de síntomas mediante texto o voz usando LLMs de última generación.
- ✅ **Recomendación de especialidad:** El agente clasifica los síntomas y sugiere el área médica correcta.
- ✅ **Transparencia financiera:** Estimación de copagos según tipo de afiliación (IESS General, Seguro Campesino, privado).
- ✅ **Logística hospitalaria inteligente:** Mapa interactivo con centros médicos cercanos, cobertura disponible y ruta óptima.
- ✅ **Sistema de alerta de emergencias:** Detección paralela de situaciones críticas (ej. infarto, ACV) con habilitación inmediata del botón 911.

---

## ⚙️ Flujo del Sistema

```
 [1] Ubicación  →  [2] Afiliación  →  [3] Síntomas  →  [4] Análisis IA  →  [5] Resultado
  GPS/Manual       IESS / Privado      Texto o Voz      LLM + Reglas         Mapa + Copago
```

| Paso | Fase | Acción del Sistema |
| :---: | :--- | :--- |
| 1️⃣ | **Ubicación** | Detecta las coordenadas del paciente para sugerir los centros de salud más cercanos y calcular la ruta óptima. |
| 2️⃣ | **Afiliación** | Selección del seguro (IESS Dependiente, Independiente, Campesino o Privado). |
| 3️⃣ | **Síntomas** | Ingreso de malestares mediante texto libre o reconocimiento de voz (Web Speech API). |
| 4️⃣ | **Análisis IA** | El agente procesa la información, identifica la especialidad y evalúa si existe una urgencia crítica en tiempo real. |
| 5️⃣ | **Resultado** | Se despliega el hospital recomendado en mapa interactivo con cobertura, copago estimado y ruta sugerida. |

---

## 🏥 Ejemplo de Interacción

> **Paciente:** *"Tengo un dolor muy fuerte en el pecho que se me irradia al brazo izquierdo."*

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨  ALERTA DE EMERGENCIA DETECTADA                             │
├─────────────────────────────────────────────────────────────────┤
│  Especialidad:        Urgencias / Cardiología                   │
│  Hospital sugerido:   OmniHospital · Guayaquil                  │
│  Cobertura:           85%                                       │
│  Copago estimado:     $8.00  (Tarifa urgencias — dato ficticio) │
│  Prioridad:           CRÍTICA ALTA                              │
│                                                                 │
│  [ 📞 Llamar al 911 ]        [ 🗺️ Ver ruta en mapa ]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React · Vite · Tailwind CSS |
| **Mapas** | Leaflet · leaflet-routing-machine |
| **Voz** | Web Speech API |
| **Backend** | Node.js · Express.js |
| **Inteligencia Artificial** | Groq Cloud API — `llama-3.3-70b-versatile` |
| **Base de datos** | Supabase (PostgreSQL) |
| **Concurrencia dev** | `concurrently` (Frontend + Backend en un solo comando) |

---

## 📁 Estructura del Proyecto

```
agent_umbrella/
├── server.js               # Backend principal — Express + Groq SDK
├── package.json
├── .env                    # Variables de entorno (no subir al repo)
└── frontend/               # App React + Vite
    ├── src/
    │   ├── components/     # Componentes React
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── vite.config.js
```

---

## 🚀 Instalación y Uso Local

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Cuenta activa en [Groq Cloud](https://console.groq.com/)
- Cuenta activa en [Supabase](https://supabase.com/)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/agent_umbrella.git
cd agent_umbrella

# 2. Instalar dependencias (raíz y frontend)
npm install
cd frontend && npm install && cd ..

# 3. Configurar variables de entorno
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Groq Cloud
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Servidor
PORT=3001
```

```bash
# 4. Iniciar Frontend y Backend en simultáneo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 👥 Equipo

Desarrollado por tres personas comprometidas con la innovación en salud tecnológica:

| Rol | Nombre | Contacto |
| :--- | :--- | :--- |
| 👑 **Líder del Proyecto** | Oswaldo Danilo Angulo Tamayo | [LinkedIn](https://www.linkedin.com/in/oswaldo-angulo-b00823311/) · odat2017@hotmail.com |
| 👨‍💻 **Desarrollador Frontend/Backend** | Darly Douglas Farias Mendoza | [LinkedIn](https://www.linkedin.com/in/darly-farias-574b0433a) · darlyfariasmendoza@gmail.com |
| 👨‍💻 **Desarrollador Frontend/Backend** | Steven Francisco Arias Pérez | [LinkedIn](https://www.linkedin.com/in/francisco-steven-arias-p%C3%A9rez-5b8663219/) · fariasp2@unemi.edu.ec |

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ en Ecuador · Hackathon 2026
</p>
