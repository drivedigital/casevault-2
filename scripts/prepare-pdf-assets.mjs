import {cp,mkdir,readFile} from 'node:fs/promises';
const {version}=JSON.parse(await readFile('node_modules/pdfjs-dist/package.json','utf8'));
await mkdir('public/pdfjs',{recursive:true});
await cp('node_modules/pdfjs-dist/build/pdf.worker.min.mjs',`public/pdfjs/pdf.worker-${version}.mjs`);
for(const folder of ['cmaps','standard_fonts','wasm'])await cp(`node_modules/pdfjs-dist/${folder}`,`public/pdfjs/${folder}`,{recursive:true});
