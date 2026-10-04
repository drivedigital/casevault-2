// Preserve the court's recorded opaque docket URL rather than reconstructing it.
export function liveNyscefUrl(sourceUrl:string|null):string|null{
 if(!sourceUrl)return null;
 try{const url=new URL(sourceUrl);return url.protocol==='https:'&&url.hostname==='iapps.courts.state.ny.us'&&url.pathname.startsWith('/nyscef/')&&!url.username&&!url.password ? url.href:null;}catch{return null;}
}
