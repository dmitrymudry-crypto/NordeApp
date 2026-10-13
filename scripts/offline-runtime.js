// Deliberately simulated API for the portable demonstration. No network or credentials.
window.NORDE_OFFLINE = true;
(() => {
  const KEY = 'norde-offline-demo-v1';
  let memory;
  const uid = () => 'demo' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2,'0')).join('');
  const client = {id:'demo-client',name:'Alex',email:'client@example.invalid',role:'client'};
  const admin = {id:'demo-admin',name:'Norde Team',email:'admin@example.invalid',role:'admin'};
  const seed = () => ({user:null,accounts:[client,admin],projects:[{id:'demo-project',_owner:client.id,name:'Alex Beispiel',address:'Beispielstraße 12, Berlin',area:5.5,rooms:1,works:['Komplettsanierung'],equipment:'Bodengleiche Dusche',extras:['LED-Spiegel'],tier:'Komplett',startDate:'2026-11-02',endDate:'2026-11-20',notes:'Helle Fliesen und ein ruhiges, modernes Design.',photos:[],consent:true,status:'Fliesen',progress:65,createdAt:'2026-10-13T12:00:00Z',updates:[{id:'demo-update',date:'2026-11-12T12:00:00Z',title:'Ihr Bad nimmt Form an',text:'Dies ist ein Beispielupdate. Die Abdichtung ist fertig; als Nächstes verlegen wir die Fliesen.',photos:[]}],invoices:[{id:'demo-invoice',number:'DEMO-001',title:'1. Abschlagsrechnung',amount:4316.33,due:'2026-11-05',status:'offen',file:null}],review:null}]});
  try {memory = JSON.parse(localStorage.getItem(KEY)) || seed();} catch {memory=seed();}
  const persist=()=>{try {localStorage.setItem(KEY,JSON.stringify(memory));}catch(e){if(e.name==='SecurityError')return;throw Error('Gerätespeicher ist voll. Bitte weniger oder kleinere Fotos verwenden.');}};
  const reply=(status,data)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,options={})=>{
    const path=String(input);if(!path.startsWith('/api/'))return nativeFetch(input,options);
    const route=path.slice(4).split('?')[0], method=options.method||'GET';
    let b;try {b=options.body?JSON.parse(options.body):{};}catch{return reply(400,{error:'Ungültige Daten.'});}
    try {
      if(route==='/health')return reply(200,{ok:true,demo:true,offline:true});
      if(route==='/demo'){memory.user=b.role==='admin'?admin:client;persist();return reply(200,{user:memory.user});}
      if(route==='/logout'){memory.user=null;persist();return reply(200,{ok:true});}
      if(route==='/register'){
        if(!b.name||!b.email||typeof b.password!=='string'||b.password.length<10||!b.consent)return reply(400,{error:'Bitte alle Felder ausfüllen.'});
        const email=b.email.trim().toLowerCase();
        if(memory.accounts.some(a=>a.email===email))return reply(400,{error:'Dieses Demo-Konto existiert bereits. Bitte anmelden.'});
        memory.user={id:uid(),name:b.name,email,role:'client'};memory.accounts.push(memory.user);persist();return reply(200,{user:memory.user});
      }
      if(route==='/login'){
        const account=memory.accounts.find(a=>a.email===String(b.email||'').trim().toLowerCase());
        if(!account||!b.password)return reply(401,{error:'Demo-Konto nicht gefunden. Bitte registrieren oder Demo ausprobieren.'});
        memory.user=account;persist();return reply(200,{user:account});
      }
      const user=memory.user;if(!user)return reply(401,{error:'Bitte zuerst anmelden.'});
      if(route==='/me')return reply(200,{user,demo:true});
      if(route==='/projects'&&method==='GET')return reply(200,{projects:memory.projects.filter(p=>user.role==='admin'||p._owner===user.id)});
      if(route==='/projects'&&method==='POST'){
        if(!b.consent||!b.address||!b.name||!(b.area>0)||!b.startDate||!b.works?.length)return reply(400,{error:'Bitte prüfen Sie Ihre Anfrage.'});
        const p={...b,id:uid(),_owner:user.id,createdAt:new Date().toISOString(),status:'Anfrage',progress:0,updates:[],invoices:[],review:null};
        memory.projects.unshift(p);persist();return reply(201,{project:p});
      }
      const match=route.match(/^\/projects\/([^/]+)(?:\/(updates|invoices|review))?$/);
      if(match){
        const p=memory.projects.find(p=>p.id===match[1]&&(user.role==='admin'||p._owner===user.id));
        if(!p)return reply(404,{error:'Projekt nicht gefunden.'});
        const action=match[2];
        if(method==='GET')return reply(200,{project:p});
        if(action==='review'&&p.status==='Abgeschlossen'&&user.role==='client')p.review={rating:b.rating,text:b.text,date:new Date().toISOString()};
        else if(user.role!=='admin')return reply(403,{error:'Nur das Norde Team kann Projekte bearbeiten.'});
        else if(!action&&method==='PATCH')Object.assign(p,b);
        else if(action==='updates')p.updates.push({...b,id:uid(),date:new Date().toISOString()});
        else if(action==='invoices')p.invoices.push({...b,id:uid(),status:'offen'});
        else return reply(400,{error:'Diese Aktion ist nicht verfügbar.'});
        persist();return reply(200,{project:p});
      }
      return reply(404,{error:'Diese Funktion ist in der Offline-Demo nicht verfügbar.'});
    }catch(e){return reply(507,{error:e.message});}
  };
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href*="/api/projects/"]');
    if(!anchor)return;
    const href=anchor.getAttribute('href'),match=href.match(/\/projects\/([^/]+)\/document\?invoice=(.+)/);if(!match)return;
    event.preventDefault();
    const p=memory.projects.find(p=>p.id===match[1]&&(memory.user?.role==='admin'||p._owner===memory.user?.id));
    const invoice=p?.invoices.find(i=>i.id===match[2]);if(!invoice?.file)return;
    if(window.webkit?.messageHandlers?.nordeDownload){window.webkit.messageHandlers.nordeDownload.postMessage({name:'Norde-Rechnung.pdf',data:invoice.file.split(',')[1]});return;}
    const binary=atob(invoice.file.split(',')[1]),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const link=document.createElement('a');link.href=url;link.download='Norde-Rechnung.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },true);
})();
