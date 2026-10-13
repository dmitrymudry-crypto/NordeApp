import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';

const port = Number(process.env.PORT || 3000);
const dataDir = resolve(process.env.NORDE_DATA_DIR || '.data');
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(join(dataDir, 'norde.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, hash TEXT, role TEXT);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT, expires INTEGER);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id TEXT, data TEXT);`);
const demo = process.env.NORDE_DEMO === '1';
const publicUser = u => ({ id:u.id, name:u.name, email:u.email, role:u.role });
const stages = ['Anfrage','Planung','Demontage','Installation','Fliesen','Feinmontage','Abgeschlossen'];
const id = () => randomBytes(12).toString('hex');
const hashPassword = password => { const salt = randomBytes(16).toString('hex'); return salt + ':' + scryptSync(password, salt, 64).toString('hex'); };
const checkPassword = (password, hash) => { const [salt, digest] = hash.split(':'); return timingSafeEqual(scryptSync(password,salt,64), Buffer.from(digest,'hex')); };
const sha = value => createHash('sha256').update(value).digest('hex');
function addUser(email,name,password,role='client') {const u = {id:id(),email,name,hash:hashPassword(password),role}; db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(u.id,email,name,u.hash,role); return u;}
function storeProject(p,userId) {db.prepare('INSERT OR REPLACE INTO projects VALUES (?,?,?)').run(p.id,userId,JSON.stringify(p));}
function createProject(user,fields) {const p={...fields,id:id(),createdAt:new Date().toISOString(),status:'Anfrage',progress:0,updates:[],invoices:[],review:null};storeProject(p,user.id);return p;}
if (demo) {
 for (const [email,name,role] of [['client@example.invalid','Alex','client'],['admin@example.invalid','Norde Team','admin']]) {
  if (!db.prepare('SELECT id FROM users WHERE email=?').get(email)) addUser(email,name,randomBytes(32).toString('hex'),role);
 }
 const u = db.prepare('SELECT * FROM users WHERE email=?').get('client@example.invalid');
 if (!db.prepare('SELECT id FROM projects WHERE user_id=?').get(u.id)) {
  const p = createProject(u,{name:'Alex Beispiel',address:'Beispielstraße 12, Berlin',area:5.5,rooms:1,works:['Komplettsanierung'],equipment:'Bodengleiche Dusche',tier:'Komplett',extras:['LED-Spiegel'],startDate:'2026-11-02',notes:'Helle Fliesen und ein ruhiges, modernes Design.',photos:[],consent:true});
  Object.assign(p,{status:'Fliesen',progress:65,endDate:'2026-11-20',updates:[{id:id(),date:'2026-11-09T12:00:00Z',title:'Die neuen Leitungen sind vorbereitet',text:'Wasser- und Abwasseranschlüsse sind verlegt. Als Nächstes folgen Abdichtung und Fliesen.',photos:[]},{id:id(),date:'2026-11-12T12:00:00Z',title:'Ihr Bad nimmt Form an',text:'Die Abdichtung ist fertig. Heute beginnen wir mit den Bodenfliesen.',photos:[]}],invoices:[{id:id(),number:'DEMO-001',title:'1. Abschlagsrechnung',amount:4316.33,due:'2026-11-05',status:'offen',file:null}]});
  storeProject(p,u.id);
 }
}
// Bootstrap a real administrator only through explicitly configured credentials.
if (process.env.NORDE_ADMIN_EMAIL && process.env.NORDE_ADMIN_PASSWORD) {
 if (process.env.NORDE_ADMIN_PASSWORD.length < 12) throw Error('Admin password must have at least 12 characters');
 const email=process.env.NORDE_ADMIN_EMAIL.toLowerCase();
 if (!db.prepare('SELECT id FROM users WHERE email=?').get(email)) addUser(email,'Norde Team',process.env.NORDE_ADMIN_PASSWORD,'admin');
}
const rates=new Map();
function rateLimit(key,max=20) {const now=Date.now();const item=rates.get(key); if(!item||item.until<now){rates.set(key,{count:1,until:now+600000});return false;}return ++item.count>max;}
setInterval(()=>{for(const [k,v] of rates)if(v.until<Date.now())rates.delete(k);db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());},60000).unref();
function response(res,status,data,headers={}) {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));}
function session(req) {const cookie=req.headers.cookie?.match(/(?:^|;\s*)norde_session=([^;]+)/)?.[1];if(!cookie)return null;return db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(sha(cookie),Date.now());}
function login(res,u) {const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(sha(token),u.id,Date.now()+604800000);response(res,200,{user:publicUser(u)},{'Set-Cookie':`norde_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.NORDE_SECURE_COOKIE==='1'?'; Secure':''}`});}
async function body(req) {let size=0;const chunks=[];for await (const c of req){size+=c.length;if(size>16*1024*1024)throw Object.assign(Error('Dateien sind zu groß (max. 16 MB).'),{status:413});chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{throw Object.assign(Error('Ungültige Anfrage.'),{status:400});}}
function requireText(v,max=500) {return typeof v==='string'&&v.trim().length>0&&v.length<=max;}
function photosValid(photos) {return Array.isArray(photos)&&photos.length<=6&&photos.every(p=>typeof p==='string'&&p.length<=2000000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p));}
const bad=(res,message)=>response(res,400,{error:message});
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 try {
  const path=new URL(req.url,'http://localhost').pathname;
  if(path.startsWith('/api/')) {
   if(!['GET','HEAD'].includes(req.method)) {if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return response(res,403,{error:'Anfrage nicht erlaubt.'});if(!req.headers['content-type']?.startsWith('application/json'))return response(res,415,{error:'JSON erwartet.'});}
   if(path==='/api/health')return response(res,200,{ok:true,demo});
   if(path==='/api/register'&&req.method==='POST') {
    if(rateLimit(req.socket.remoteAddress+':auth'))return response(res,429,{error:'Bitte später erneut versuchen.'});
    const b=await body(req);const email=b.email?.trim().toLowerCase();
    if(!requireText(b.name,100)||!email||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof b.password!=='string'||b.password.length<10||b.password.length>128||b.consent!==true)return bad(res,'Name, gültige E-Mail, Passwort (10–128 Zeichen) und Zustimmung erforderlich.');
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email))return bad(res,'Dieses Konto kann nicht angelegt werden. Bitte melden Sie sich an.');
    return login(res,addUser(email,b.name.trim(),b.password));
   }
   if(path==='/api/login'&&req.method==='POST') {
    if(rateLimit(req.socket.remoteAddress+':auth'))return response(res,429,{error:'Bitte später erneut versuchen.'});
    const b=await body(req);const u=db.prepare('SELECT * FROM users WHERE email=?').get(String(b.email||'').trim().toLowerCase());
    if(typeof b.password!=='string'||b.password.length>128||!u||!checkPassword(b.password,u.hash))return response(res,401,{error:'E-Mail oder Passwort stimmen nicht.'});return login(res,u);
   }
   if(path==='/api/demo'&&req.method==='POST'&&demo) {const b=await body(req);return login(res,db.prepare('SELECT * FROM users WHERE email=?').get(b.role==='admin'?'admin@example.invalid':'client@example.invalid'));}
   if(path==='/api/logout'&&req.method==='POST'){const token=req.headers.cookie?.match(/(?:^|;\s*)norde_session=([^;]+)/)?.[1];if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(sha(token));return response(res,200,{ok:true},{'Set-Cookie':'norde_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
   const u=session(req);if(!u)return response(res,401,{error:'Bitte zuerst anmelden.'});
   if(path==='/api/me')return response(res,200,{user:publicUser(u),demo});
   if(path==='/api/projects'&&req.method==='GET'){const rows=u.role==='admin'?db.prepare('SELECT * FROM projects ORDER BY rowid DESC').all():db.prepare('SELECT * FROM projects WHERE user_id=? ORDER BY rowid DESC').all(u.id);return response(res,200,{projects:rows.map(r=>JSON.parse(r.data))});}
   if(path==='/api/projects'&&req.method==='POST') {
    const b=await body(req);
    if(!requireText(b.name,100)||!requireText(b.address,300)||!Number.isFinite(b.area)||b.area<=0||b.area>100||!Number.isInteger(b.rooms)||b.rooms<1||b.rooms>10||b.consent!==true||!['Essential','Komplett','Signature'].includes(b.tier)||!Array.isArray(b.works)||b.works.length===0||b.works.some(x=>!requireText(x,100))||!Array.isArray(b.extras)||b.extras.length>10||b.extras.some(x=>!requireText(x,100))||!requireText(b.equipment,100)||typeof b.notes!=='string'||b.notes.length>3000||!/^\d{4}-\d{2}-\d{2}$/.test(b.startDate)||!photosValid(b.photos))return bad(res,'Bitte prüfen Sie die Angaben und Fotos Ihrer Anfrage.');
    const {name,address,area,rooms,tier,works,extras,equipment,notes,startDate,photos}=b;
    return response(res,201,{project:createProject(u,{name,address,area,rooms,tier,works,extras,equipment,notes,startDate,photos,consent:true,consentAt:new Date().toISOString()})});
   }
   const match=path.match(/^\/api\/projects\/([a-f0-9]+)(?:\/(updates|invoices|review|document))?$/);
   if(match) {
    const row=db.prepare('SELECT * FROM projects WHERE id=?').get(match[1]);
    if(!row||(u.role!=='admin'&&row.user_id!==u.id))return response(res,404,{error:'Projekt nicht gefunden.'});
    const p=JSON.parse(row.data), action=match[2];
    if(req.method==='GET'&&action==='document') {
     const invoice=p.invoices.find(i=>i.id===new URL(req.url,'http://localhost').searchParams.get('invoice'));
     if(!invoice?.file)return response(res,404,{error:'Noch kein PDF hinterlegt.'});
     res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Norde-Rechnung.pdf"','Cache-Control':'no-store'});return res.end(Buffer.from(invoice.file.split(',')[1],'base64'));
    }
    if(req.method==='GET'&&!action)return response(res,200,{project:p});
    const b=await body(req);
    if(action==='review'&&req.method==='POST') {if(p.status!=='Abgeschlossen'||u.role!=='client'||!Number.isInteger(b.rating)||b.rating<1||b.rating>5||!requireText(b.text,2000))return bad(res,'Bewertungen sind nach Projektabschluss möglich.');p.review={rating:b.rating,text:b.text,date:new Date().toISOString()};}
    else {
     if(u.role!=='admin')return response(res,403,{error:'Nur das Norde Team kann Projekte bearbeiten.'});
     if(!action&&req.method==='PATCH'){if(!stages.includes(b.status)||!Number.isInteger(b.progress)||b.progress<0||b.progress>100||![b.startDate,b.endDate].every(x=>!x||/^\d{4}-\d{2}-\d{2}$/.test(x)))return bad(res,'Ungültiger Projektstatus.');Object.assign(p,{status:b.status,progress:b.progress,startDate:b.startDate||p.startDate,endDate:b.endDate||''});}
     else if(action==='updates'&&req.method==='POST'){if(!requireText(b.title,150)||!requireText(b.text,3000)||!photosValid(b.photos))return bad(res,'Titel, Nachricht und gültige Fotos erforderlich.');p.updates.push({id:id(),title:b.title,text:b.text,photos:b.photos,date:new Date().toISOString()});}
     else if(action==='invoices'&&req.method==='POST'){if(!requireText(b.number,80)||!requireText(b.title,150)||!Number.isFinite(b.amount)||b.amount<=0||b.amount>1000000||!/^\d{4}-\d{2}-\d{2}$/.test(b.due)||!/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(b.file||'')||!Buffer.from(b.file.split(',')[1],'base64').subarray(0,5).equals(Buffer.from('%PDF-')))return bad(res,'Bitte Rechnungsdaten und eine gültige PDF-Datei angeben.');p.invoices.push({id:id(),number:b.number,title:b.title,amount:b.amount,due:b.due,file:b.file,status:'offen'});}
     else return response(res,405,{error:'Methode nicht erlaubt.'});
    }
    storeProject(p,row.user_id);return response(res,200,{project:p});
   }
   return response(res,404,{error:'Nicht gefunden.'});
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return response(res,405,{error:'Methode nicht erlaubt.'});
  const root=resolve('dist');let file=resolve(root,'.'+decodeURIComponent(path));
  if(file!==root&&!file.startsWith(root+'/'))return response(res,403,{error:'Nicht erlaubt.'});
  if(!existsSync(file)||path==='/')file=join(root,'index.html');
  if(!existsSync(file))return response(res,503,{error:'Bitte zuerst npm run build ausführen.'});
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'};
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
 }catch(e){response(res,e.status||500,{error:e.status?e.message:'Die Anfrage konnte nicht verarbeitet werden.'});if(!e.status)console.error('Request failed:',e.name);}
});
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Norde server ready on port ${port}; demo=${demo}`));
function shutdown(){server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
