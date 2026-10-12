/** B-047 exact local/Codespaces/cloud same-origin boundary. */
import type {IncomingMessage} from 'node:http';
export function isAllowedPreviewRequest(req:Pick<IncomingMessage,'headers'>):boolean{
 const host=String(req.headers.host??''),origin=req.headers.origin as string|undefined;
 if(process.env['Ywoom_CLOUD']==='1' || process.env['Ywoom_PUBLIC']==='1' || process.env['K_SERVICE'] || process.env['FIREBASE_APP_HOSTING']){
   if(!origin) return true;
   try{ return new URL(origin).host===host; }catch{ return false; }
 }
 const extra=String(process.env['Ywoom_ALLOW_HOST']??'');
 if(extra && host===extra) return !origin || origin===`https://${host}` || origin===`http://${host}`;
 if(/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host))return !origin||origin===`http://${host}`;
 const name=process.env['CODESPACE_NAME'],domain=process.env['GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN'],port=process.env['PORT']??'3000';
 if(!name||!domain)return false;
 const expected=`${name}-${port}.${domain}`;
 return host===expected&&(!origin||origin===`https://${expected}`);
}
export function isPublicCloud():boolean{
 return process.env['Ywoom_CLOUD']==='1' || process.env['Ywoom_PUBLIC']==='1' || !!process.env['K_SERVICE'] || !!process.env['FIREBASE_APP_HOSTING'];
}
