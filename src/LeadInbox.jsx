import React,{useEffect,useState} from 'react';
import {LEAD_STATUSES} from './lead-schema.js';

export default function LeadInbox(){
 const [leads,setLeads]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 async function refresh(){try{const r=await fetch('/api/leads');const b=await r.json();if(!r.ok)throw Error(b.error||'Anfragen nicht verfügbar.');setLeads(b.leads);setError('');}catch(e){setError(e.message)}finally{setLoading(false)}}
 useEffect(()=>{refresh()},[]);
 async function update(id,status){const r=await fetch('/api/leads/'+id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status})});if(!r.ok){setError('Status konnte nicht gespeichert werden.');return;}await refresh()}
 return <section className="lead-inbox"><div className="page-heading"><h1>Neue Anfragen</h1><p>Konfigurationen und Erstkontakte</p></div>{loading?<p>Lädt …</p>:null}{error?<p role="alert">{error}</p>:null}<button onClick={refresh}>Aktualisieren</button>{leads.map(lead=><article className="card" key={lead.id} style={{margin:'15px 0'}}><h2 style={{fontSize:19}}>{lead.name}</h2><p>{lead.address} · {lead.configuration?.area} m²</p><p>Tel: <a href={'tel:'+lead.phone}>{lead.phone}</a> {lead.email&&<>· <a href={'mailto:'+lead.email}>{lead.email}</a></>}</p><p>Ausstattung: {lead.configuration?.equipment}</p><p>Extras: {lead.configuration?.extras?.join(', ')||'Keine'}</p><p><strong>{lead.quote?.total==null?'Individuelles Angebot':new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(lead.quote.total)}</strong> · Unverbindlicher Testwert</p>{lead.notes&&<p>Notiz: {lead.notes}</p>}<label>Status: <select value={lead.status} onChange={e=>update(lead.id,e.target.value)}>{LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label></article>)}{!loading&&!leads.length&&!error?<p>Noch keine Anfragen.</p>:null}</section>
}
