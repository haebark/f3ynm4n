const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SLUG = /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,159}$/u;
const ERROR_STATUS = {
  engagement_not_found: 404, engagement_invalid: 400, engagement_conflict: 409,
  engagement_rate_limited: 429, engagement_comments_disabled: 503,
  engagement_disabled: 503, engagement_unauthorized: 503,
};
function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {status, headers: {
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',...(status===429?{'Retry-After':'60'}:{}),
  }});
}
function bad(status, code) { return reply({error:code}, status); }
function normalized(value, max, singleLine=false) {
  if (typeof value!=='string') return null;
  const v=value.normalize('NFC').trim();
  if (!v || [...v].length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v)) return null;
  if (singleLine && /[\r\n\t]/u.test(v)) return null;
  return v;
}
async function readJSON(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||'')) throw new Error('content_type');
  if (Number(request.headers.get('content-length'))>8192) throw new Error('too_large');
  if (!request.body) throw new Error('invalid');
  const reader=request.body.getReader();let size=0;const parts=[];
  while(true) {
    const {done,value}=await reader.read();if(done)break;
    size+=value.byteLength;
    if(size>8192){await reader.cancel();throw new Error('too_large');}parts.push(value);
  }
  const all=new Uint8Array(size);let offset=0;
  for(const part of parts){all.set(part,offset);offset+=part.byteLength;}
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
  if(!data || typeof data!=='object' || Array.isArray(data))throw new Error('invalid');
  return data;
}
async function hash(secret, domain, value) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const data=new TextEncoder().encode(domain+'\n'+value);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,data))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function cursorDecode(text) {
  if(!text)return {p_before_time:null,p_before_id:null};
  if(text.length>240)throw new Error('invalid');
  const v=JSON.parse(atob(text.replace(/-/g,'+').replace(/_/g,'/')));
  if(!v || !UUID.test(v.id) || typeof v.time!=='string' || !Number.isFinite(Date.parse(v.time)))throw new Error('invalid');
  return {p_before_time:v.time,p_before_id:v.id};
}
function cursorEncode(comment) {
  return btoa(JSON.stringify({time:comment.created_at,id:comment.id})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function handleRequest(request, env, fetcher=fetch) {
  const url=new URL(request.url);
  if(!['GET','POST'].includes(request.method))return bad(405,'method_not_allowed');
  if(typeof env.ENGAGEMENT_TOKEN!=='string' || env.ENGAGEMENT_TOKEN.length<32 ||
     !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY)return bad(503,'not_configured');
  let database;
  try { database=new URL(env.SUPABASE_URL); } catch { return bad(503,'not_configured'); }
  if(database.protocol!=='https:' || !database.hostname.endsWith('.supabase.co'))return bad(503,'not_configured');
  async function rpc(name,params) {
    const res=await fetcher(new URL('/rest/v1/rpc/'+name,database),{
      method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({p_token:env.ENGAGEMENT_TOKEN,...params}),signal:AbortSignal.timeout(6000),
    });
    let body;try {body=await res.json();}catch {throw new Error('upstream');}
    if(!res.ok)throw new Error(Object.hasOwn(ERROR_STATUS,body.message)?body.message:'upstream');
    if(!body || typeof body!=='object' || Array.isArray(body))throw new Error('upstream');
    return body;
  }
  try {
    if(request.method==='GET') {
      const slug=url.searchParams.get('slug')||'';
      if(!SLUG.test(slug))return bad(400,'invalid');
      let cursor;try {cursor=cursorDecode(url.searchParams.get('before'));}catch {return bad(400,'invalid');}
      const ip=request.headers.get('cf-connecting-ip');
      if(!ip || ip.length>64)return bad(503,'edge_identity_unavailable');
      const day=new Date().toISOString().slice(0,10);
      const ipHash=await hash(env.ENGAGEMENT_TOKEN,'ip-v1',day+'\n'+ip);
      const data=await rpc('f3_engagement_read',{p_slug:slug,p_ip_hash:ipHash,...cursor});
      if(!Array.isArray(data.comments))throw new Error('upstream');
      const hasMore=data.comments.length>20;const comments=data.comments.slice(0,20).map(c=>({
        id:c.id,nickname:String(c.nickname),body:String(c.body),created_at:c.created_at,
      }));
      return reply({views:Number(data.views),started_at:data.started_at,comments_enabled:data.comments_enabled===true,
        comment_mode:data.comment_mode==='open'?'open':'moderated',comment_count:Number(data.comment_count),
        comments,next_cursor:hasMore?cursorEncode(comments.at(-1)):null});
    }
    const origin=env.SITE_ORIGIN||'https://f3ynm4n.com';
    if(request.headers.get('origin')!==origin || request.headers.get('sec-fetch-site')==='cross-site')return bad(403,'origin_not_allowed');
    // Cloudflare supplies/overwrites this header at the deployed edge. Never persist the raw IP.
    const ip=request.headers.get('cf-connecting-ip');
    if(!ip || ip.length>64)return bad(503,'edge_identity_unavailable');
    let body;try {body=await readJSON(request);}catch(e) {return bad(e.message==='too_large'?413:400,'invalid');}
    if(typeof body.slug!=='string' || !SLUG.test(body.slug))return bad(400,'invalid');
    const day=new Date().toISOString().slice(0,10);
    const ipHash=await hash(env.ENGAGEMENT_TOKEN,'ip-v1',day+'\n'+ip);
    if(body.action==='view') {
      const ua=(request.headers.get('user-agent')||'').slice(0,256);
      const visitor=await hash(env.ENGAGEMENT_TOKEN,'view-v1',day+'\n'+ip+'\n'+ua);
      const data=await rpc('f3_engagement_view',{p_slug:body.slug,p_ip_hash:ipHash,p_visitor_hash:visitor});
      return reply({views:Number(data.views)});
    }
    if(body.action==='comment') {
      if(body.website!==undefined && body.website!=='')return bad(400,'invalid');
      const nickname=normalized(body.nickname,24,true),content=normalized(body.body,2000);
      if(!nickname || !content || !UUID.test(body.request_id||''))return bad(400,'invalid');
      const data=await rpc('f3_engagement_comment',{
        p_slug:body.slug,p_ip_hash:ipHash,p_request_id:body.request_id,p_nickname:nickname,p_body:content,
      });
      return reply({id:data.id,status:data.status==='approved'?'approved':'pending'},201);
    }
    return bad(400,'invalid');
  } catch(e) {
    const status=ERROR_STATUS[e.message]||503;
    return bad(status,status===429?'too_many_requests':status===404?'not_found':status===400?'invalid':
      status===409?'request_conflict':'temporarily_unavailable');
  }
}
export const onRequest=({request,env})=>handleRequest(request,env);
