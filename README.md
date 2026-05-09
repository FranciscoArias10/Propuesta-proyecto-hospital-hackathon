# 🩺 Agent_Umbrella

<p align="center">
  <img src="https://img.shields.io/badge/Estado-MVP-success?style=for-the-badge" alt="Status MVP">
  <img src="https://img.shields.io/badge/Región-Ecuador-blue?style=for-the-badge" alt="Ecuador">
  <img src="https://img.shields.io/badge/Enfoque-Salud_Pública-red?style=for-the-badge" alt="Salud">
</p>

<p align="center">
  <b>Asistente conversacional inteligente para la orientación médica y estimación de copagos en Ecuador.</b>
  <br />
  <i>Claridad y transparencia en tu salud antes de salir de casa.</i>
</p>

---

## 📌 Descripción
**Agent_Umbrella** es una plataforma diseñada para empoderar a los pacientes. Permite entender los beneficios médicos y costos asociados antes de acudir a un hospital, facilitando la toma de decisiones informada.

---

## 🚀 La Problemática
Muchos pacientes en Ecuador enfrentan incertidumbre al buscar atención médica:
* **Desconocimiento de costos:** ¿Cuánto tendré que pagar de copago?
* **Red de atención:** ¿Qué hospitales aceptan mi tipo de afiliación?
* **Especialidad correcta:** ¿A qué área debo dirigirme según mis síntomas?

Esto genera pérdida de tiempo, estrés financiero y saturación innecesaria en centros de salud.

---

## 💡 La Solución
Nuestra plataforma ofrece un acompañamiento integral:

* ✅ **Triaje asistido:** Análisis descriptivo de síntomas.
* ✅ **Recomendación precisa:** Sugerencia de especialidad médica.
* ✅ **Transparencia financiera:** Estimación de copagos en tiempo real.
* ✅ **Logística hospitalaria:** Consulta de cobertura y disponibilidad según ubicación.

---

## ⚙️ Flujo del Sistema

| Paso | Fase | Acción del Sistema |
| :--- | :--- | :--- |
| 1️⃣ | **Ubicación** | Detecta tu posición para sugerir el centro más cercano. |
| 2️⃣ | **Afiliación** | Selección del seguro (Dependencia, Independiente o Campesino). |
| 3️⃣ | **Síntomas** | Ingreso de datos mediante texto o voz (ej: *"Dolor en el pecho"*). |
| 4️⃣ | **Análisis** | El sistema identifica la especialidad y la prioridad del caso. |
| 5️⃣ | **Resultado** | Muestra el hospital recomendado, cobertura y copago estimado. |

---

## 🏥 Ejemplo de Respuesta
Cuando un usuario consulta, el sistema genera una ficha clara:

```yaml
Especialidad: Cardiología
Hospital: OmniHospital (Guayaquil)
Cobertura: 85%
Copago Estimado: $8.00
Prioridad: Alta
