import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

console.log('\n🔍 Buscando todas las bases de datos accesibles para tu integración...\n');

try {
  const res = await notion.search({
    filter: { value: 'data_source', property: 'object' }
  });

  if (res.results.length === 0) {
    console.log('❌ Tu integración NO tiene acceso a ninguna base de datos todavía.');
    console.log('');
    console.log('📌 PASOS PARA SOLUCIONARLO EN NOTION:');
    console.log('   1. Abre notion.so en tu navegador');
    console.log('   2. Ve a la página/tabla con tus hospitales');
    console.log('   3. Haz clic en los "..." (tres puntos) arriba a la derecha');
    console.log('   4. Busca "Connections" o "Conexiones"');
    console.log('   5. Haz clic en "Add connection" y selecciona "Agente-umbrella"');
    console.log('   6. Vuelve a correr: node test_conexion.js');
  } else {
    console.log(`✅ Tu integración puede ver ${res.results.length} base(s) de datos:\n`);
    res.results.forEach((db, i) => {
      const title = db.title?.[0]?.plain_text || '(sin título)';
      console.log(`   [${i+1}] ID: ${db.id}`);
      console.log(`       Nombre: ${title}`);
      console.log('');
    });

    const targetId = process.env.NOTION_DATABASE_ID.replace(/-/g, '');
    const found = res.results.find(db => db.id.replace(/-/g, '') === targetId);
    if (found) {
      console.log('✅ ¡Tu NOTION_DATABASE_ID coincide! Todo debería funcionar.');
    } else {
      console.log('⚠️  Tu NOTION_DATABASE_ID NO está en la lista de arriba.');
      console.log('   Copia el ID correcto de la lista y ponlo en tu .env');
    }
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
