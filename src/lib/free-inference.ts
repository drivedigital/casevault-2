import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { isFreePricing,hasNvidiaFreeEntitlement } from './processing-types';
import { z } from 'zod';
export async function freeModelCheck(provider: string, model: string) {
    if (provider === 'nvidia' && model === 'nvidia/nemotron-3.5-lightning-30b-a3b') {
        const evidenceUrl='https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b';
        const page=await fetch(evidenceUrl,{signal:AbortSignal.timeout(20000),redirect:'manual',cache:'no-store'});
        if(!page.ok)throw new Error('NVIDIA free endpoint entitlement could not be verified');
        const html=await page.text();if(html.length>2000000)throw new Error('Unexpected NVIDIA entitlement response');
        if(!hasNvidiaFreeEntitlement(model,html))throw new Error('NVIDIA endpoint is not currently documented free');
        const env=getCloudflareContext().env;if(env.NVIDIA_ENDPOINT.replace(/\/+$/,'')!=='https://integrate.api.nvidia.com/v1')throw new Error('Only the documented NVIDIA free prototype endpoint is allowed');
        const response=await fetch('https://integrate.api.nvidia.com/v1/models',{headers:{Authorization:`Bearer ${env.NVIDIA_KEY}`},signal:AbortSignal.timeout(20000),redirect:'manual'});
        if(!response.ok)throw new Error('NVIDIA model availability check failed');
        const models=z.object({data:z.array(z.object({id:z.string()}))}).parse(await response.json());if(!models.data.some(m=>m.id===model))throw new Error('NVIDIA model is unavailable');
        return {provider,model,pricing:{prompt:'0',completion:'0'},verifiedAt:new Date().toISOString(),evidenceUrl,entitlement:'Documented free prototyping endpoint; fixed ten-document pilot only'};
    }
    if (provider !== 'openrouter')
        throw new Error('Free account entitlement is not verified for this provider. Select a zero-priced OpenRouter :free model.');
    const response = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(20000), redirect: 'manual', cache: 'no-store' });
    if (!response.ok) {
        await response.body?.cancel();
        throw new Error('Could not verify current free model pricing');
    }
    const catalog = z.object({ data: z.array(z.object({ id: z.string() }).passthrough()) }).parse(await response.json());
    const raw=catalog.data.find(m=>m.id===model);if(!raw)throw new Error('Selected free model is unavailable; no inference was sent');
    const selected = z.object({ id: z.string(), pricing: z.record(z.string(), z.union([z.string(), z.number()])).optional() }).parse(raw);
    if (!selected || !isFreePricing(selected))
        throw new Error('Model has no confirmed zero-priced free variant. No inference was sent.');
    return { provider, model, pricing: selected.pricing, verifiedAt: new Date().toISOString() };
}
export async function freeInference(provider: string, model: string, system: string, prompt: string) {
    const pricing = await freeModelCheck(provider, model);
    const env=getCloudflareContext().env;const key = provider==='nvidia'?env.NVIDIA_KEY:env.OPEN_ROUTER_KEY;
    if (!key)
        throw new Error('OpenRouter credential missing');
    const response = await fetch(provider==='nvidia'?'https://integrate.api.nvidia.com/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], max_tokens: 6000, reasoning: { enabled: false, exclude: true }, temperature: 0, stream: false, ...(provider==='nvidia'?{chat_template_kwargs:{enable_thinking:false}}:{provider: { allow_fallbacks: false }}) }), signal: AbortSignal.timeout(90000), redirect: 'manual' });
    if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Free inference returned HTTP ${response.status}; no paid fallback was used`);
    }
    const result = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })), usage: z.object({ prompt_tokens: z.number().optional(), completion_tokens: z.number().optional(), cost: z.number().optional() }).optional() }).parse(await response.json());
    const text = result.choices[0]?.message.content;
    if (!text)
        throw new Error('Model returned no analysis');
    if (result.usage?.cost && result.usage.cost > 0)
        throw new Error('Provider reported unexpected nonzero cost; stop and investigate');
    return { text, pricing, usage: result.usage };
}
