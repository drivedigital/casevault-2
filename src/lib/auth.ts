export async function equalSecret(a: string, b: string) {
  if (!a || !b) return false;
  const encode = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map(v => crypto.subtle.digest("SHA-256", encode.encode(v))));
  const left = new Uint8Array(x); const right = new Uint8Array(y);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}
export async function signSession(expires: string, secret: string) {
  const encode = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encode.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encode.encode(`casevault-2:${expires}`));
  return `${expires}.${Array.from(new Uint8Array(signature)).map(b=>b.toString(16).padStart(2,"0")).join("")}`;
}
export async function validSession(value: string, secret: string) {
  const expires = value.split(".")[0];
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  return equalSecret(value, await signSession(expires, secret));
}

// Authorization uses the server-verified identity, never editable user_metadata.
export function authorizedGoogleUser(user:{email?:string;email_confirmed_at?:string;identities?:{provider:string}[]}|null,allowedEmail:string){
 return !!user?.email_confirmed_at && !!allowedEmail && user.email?.toLowerCase()===allowedEmail.trim().toLowerCase() && user.identities?.some(identity=>identity.provider==='google')===true;
}
