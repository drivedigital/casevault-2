import test from 'node:test';
import assert from 'node:assert/strict';
import {equalSecret,signSession,validSession} from '../src/lib/auth';
import {importSchemas} from '../src/lib/import-schema';
test('sessions reject tampering, another signing key and expiration',async()=>{
 const value=await signSession(String(Date.now()+60000),'test-key');
 assert.equal(await validSession(value,'test-key'),true);
 assert.equal(await validSession(value+'0','test-key'),false);
 assert.equal(await validSession(value,'other-key'),false);
 assert.equal(await validSession(await signSession('1','test-key'),'test-key'),false);
 assert.equal(await equalSecret('',''),false);
});
test('imports reject unknown properties and malformed hashes',()=>{
 const row={externalId:'test',title:'original',sourceType:'upload',pageCount:1,sha256:'a'.repeat(64)};
 assert.equal(importSchemas.documents.safeParse(row).success,true);
 assert.equal(importSchemas.documents.safeParse({...row,workspaceId:'another'}).success,false);
 assert.equal(importSchemas.documents.safeParse({...row,sha256:'title-match'}).success,false);
 assert.equal(importSchemas.documents.safeParse({...row,pageCount:-1}).success,false);
 assert.equal(importSchemas.jobs.safeParse({idempotencyKey:'x',kind:'extract',payload:{},status:'complete'}).success,false);
});

test('workspace accepts only the verified authorized Google identity',async()=>{
 const {authorizedGoogleUser}=await import('../src/lib/auth');
 const owner={email:'dgeorgenyc@gmail.com',email_confirmed_at:'2026-10-04',identities:[{provider:'google'}]};
 assert.equal(authorizedGoogleUser(owner,'dgeorgenyc@gmail.com'),true);
 assert.equal(authorizedGoogleUser({...owner,email:'another@example.com'},'dgeorgenyc@gmail.com'),false);
 assert.equal(authorizedGoogleUser({...owner,email_confirmed_at:undefined},'dgeorgenyc@gmail.com'),false);
 assert.equal(authorizedGoogleUser({...owner,identities:[{provider:'email'}]},'dgeorgenyc@gmail.com'),false);
 assert.equal(authorizedGoogleUser(owner,''),false);
 assert.equal(authorizedGoogleUser(null,'dgeorgenyc@gmail.com'),false);
});
