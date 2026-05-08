# Estimador Agéntico de Copago y Cobertura Médica

Este proyecto es un asistente inteligente diseñado para brindar transparencia médica a los pacientes. Utilizando Inteligencia Artificial y una interfaz conversacional por voz, el sistema permite a los usuarios conocer cuánto pagarán por su atención médica antes de agendar una cita.

## Características Principales

- **Interacción por Voz:** Interfaz amigable y accesible que permite a los pacientes hablar de sus síntomas utilizando el micrófono, ideal para usuarios menos familiarizados con la tecnología.
- **Análisis de Síntomas con IA:** El asistente entiende los síntomas del paciente y recomienda la especialidad médica más adecuada.
- **Simulación de Cobertura:** Cruza información con planes de seguro médico (ej. IESS, aseguradoras privadas).
- **Comparativa de Opciones:** Sugiere diferentes hospitales o clínicas, mostrando el porcentaje de cobertura y un estimado del copago en dólares.
- **Checklist Visual:** Genera una lista dinámica en pantalla con los datos más importantes (especialidad, mejor opción y copago estimado).

## Tecnologías Utilizadas

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Node.js, Express, dotenv, cors.
- **Inteligencia Artificial:** Groq SDK (Modelo `llama-3.3-70b-versatile`).
- **Reconocimiento de Voz:** Web Speech API para síntesis y reconocimiento de voz nativo en el navegador.

## Cómo ejecutar el proyecto localmente

1. Asegúrate de tener instalado [Node.js](https://nodejs.org/).
2. Clona el repositorio y entra a la carpeta del proyecto.
3. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
4. Configura tus variables de entorno en un archivo `.env` en la raíz del proyecto (debe incluir tu `GROQ_API_KEY` o las variables necesarias).
5. Inicia los servidores frontend (Vite) y backend (Express) de forma simultánea:
   ```bash
   npm run dev
   ```
6. Abre [http://localhost:5173/](http://localhost:5173/) para ver la aplicación en el navegador.

---

## Colaboradores

- darlyfariasmendoza@gmail.com
- fariasp2@unemi
- odat2017@hotmail.com
