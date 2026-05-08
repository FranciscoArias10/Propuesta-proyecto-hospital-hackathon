import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import Groq from 'groq-sdk';

dotenv.config();

console.log('\n====================================');
console.log('   TEST DE CONEXIONES DEL PROYECTO  ');
console.log('====================================\n');

// ─── 1. VERIFICAR VARIABLES DE ENTORNO ───────────────────────────────────────
console.log('📋 [1/3] Variables de entorno...');
const groqKey = process.env.GROQ_API_KEY;
const notionToken = process.env.NOTION_TOKEN;
const notionDbId = process.env.NOTION_DATABASE_ID;

if (groqKey) console.log('   ✅ GROQ_API_KEY cargada');
else         console.log('   ❌ GROQ_API_KEY FALTA en .env');

if (notionToken) console.log('   ✅ NOTION_TOKEN cargado');
else             console.log('   ❌ NOTION_TOKEN FALTA en .env');

if (notionDbId) console.log('   ✅ NOTION_DATABASE_ID cargado:', notionDbId);
else            console.log('   ❌ NOTION_DATABASE_ID FALTA en .env');

// ─── 2. PROBAR GROQ ───────────────────────────────────────────────────────────
console.log('\n🤖 [2/3] Probando conexión con Groq (IA)...');
try {
  const groq = new Groq({ apiKey: groqKey });
  const res = await groq.chat.completions.create({
    messages: [{ role: 'user', content: 'Di solo: OK' }],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 5,
  });
  console.log('   ✅ Groq responde correctamente:', res.choices[0].message.content.trim());
} catch (e) {
  console.log('   ❌ Error en Groq:', e.message);
}

// ─── 3. PROBAR NOTION ─────────────────────────────────────────────────────────
console.log('\n📊 [3/3] Probando conexión con Notion...');
try {
  const notion = new Client({ auth: notionToken });
  const response = await notion.dataSources.query({
    data_source_id: notionDbId,
  });
  const count = response.results.length;
  console.log(`   ✅ Notion conectado correctamente. Registros encontrados: ${count}`);
  if (count > 0) {
    const props = Object.keys(response.results[0].properties);
    console.log('   📌 Columnas detectadas en tu tabla:', props.join(', '));
  }
} catch (e) {
  const msg = e.message || '';
  if (msg.includes('object_not_found')) {
    console.log('   ❌ Notion: Base de datos no encontrada.');
    console.log('   👉 Solución: Abre tu DB en Notion → "..." → Connections → Añade "Agente-umbrella"');
  } else if (msg.includes('unauthorized') || msg.includes('API token is invalid')) {
    console.log('   ❌ Notion: Token inválido. Verifica NOTION_TOKEN en .env');
  } else {
    console.log('   ❌ Notion error:', msg);
  }
}

console.log('\n====================================\n');
