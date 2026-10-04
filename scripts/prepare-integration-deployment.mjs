// Offline payload preparation. Account requests must use the Cloudflare integration.
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {join,extname,relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {hash} from 'blake3-wasm';
const base='.open-next/assets',manifest={},files={};
function walk(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())walk(path);else{const bytes=readFileSync(path),h=hash(bytes.toString('base64')+extname(path).slice(1)).toString('hex').slice(0,32);manifest['/'+relative(base,path)]={hash:h,size:bytes.length};files[h]=path;}}}
walk(base);writeFileSync('.private/asset-manifest.json',JSON.stringify({manifest}));writeFileSync('.private/asset-files.json',JSON.stringify(files));
const parts=[];const boundary='casevaultIntegrationDeploy';
for(const name of readdirSync('.private/comparison-deploy').filter(n=>n.endsWith('.wasm')||n==='integration-worker.js')){parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${name}"\r\nContent-Type: ${name.endsWith('.wasm')?'application/wasm':'application/javascript+module'}\r\n\r\n`),readFileSync('.private/comparison-deploy/'+name),Buffer.from('\r\n'));}
// Metadata is prepended in the integration after obtaining the assets completion JWT.
writeFileSync('.private/worker-parts.gz.b64',gzipSync(Buffer.concat(parts)).toString('base64'));
console.log(JSON.stringify({assets:Object.keys(manifest).length,moduleBytes:parts.reduce((n,b)=>n+b.length,0),compressedBase64:statSync('.private/worker-parts.gz.b64').size}));
