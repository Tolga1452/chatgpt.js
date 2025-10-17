import { readdirSync, writeFileSync } from 'fs';

const classes = readdirSync('src/classes').filter(file => file.endsWith('.ts'));
const types = readdirSync('src/types').filter(file => file.endsWith('.ts'));

let exports = '';

console.log('Exporting classes:', classes);

exports += `// Classes\n${classes.map(file => `export * from './classes/${file.replace('.ts', '.js')}';`).join('\n')}`;

console.log('Exporting types...');

exports += "\n\n// Types\n" + types.map(file => `export * from './types/${file.replace('.ts', '.js')}';`).join('\n') + '\n';

writeFileSync('src/index.ts', exports);

console.log(`Exported ${classes.length} classes and ${types.length} types to src/index.ts`);
