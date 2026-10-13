import React,{useState} from 'react';
import {ArrowRight, CheckCircle2, CircleAlert} from 'lucide-react';
import './lead-form.css';

export default function LeadForm({configuration,onBack}){
 const [data,setData]=useState({name:'',phone:'',email:'',address:'',notes:'',startDate:'',consent:false,website:''});
 const [busy,setBusy]=useState(false),[sent,setSent]=useState(null),[error,setError]=useState('');
 const set=(k,v)=>setData(old=>({...old,[k]:v}));
 async function submit(e){
  e.preventDefault();setBusy(true);setError('');
  try {
   if(window.NORDE_OFFLINE===true)throw Error('In dieser Offline-Demo können keine echten Anfragen übermittelt werden. Bitte kontaktieren Sie info@norde-dev.de direkt.');
   const id=crypto.randomUUID();
   const result=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,configuration,clientRequestId:id})});
   const response=await result.json();
   if(!result.ok||!response.accepted)throw Error(response.error||'Anfrage konnte nicht gespeichert werden.');
   setSent(response.id);
  }catch(e){setError(e.message);}
  finally{setBusy(false);}
 }
 if(sent)return <section className="lead-form"><CheckCircle2 size={38}/><h1>Vielen Dank!</h1><p>Ihre Anfrage wurde gespeichert. Das Norde Team meldet sich bei Ihnen.</p><p>Referenz: {sent}</p><button onClick={onBack}>Zurück zum Preisrechner</button></section>;
 return <section className="lead-form">
 <button className="lead-back" type="button" onClick={onBack}>← Zurück zur Kalkulation</button>
 <h1>Ihre Konfiguration anfragen</h1>
 <p>Ganz unverbindlich – ohne Registrierung. Wir prüfen Ihre Angaben und besprechen die Details persönlich.</p>
 <form onSubmit={submit}>
 <label>Name *<input required maxLength={100} autoComplete="name" value={data.name} onChange={e=>set('name',e.target.value)}/></label>
 <label>Telefon *<input required type="tel" maxLength={35} autoComplete="tel" value={data.phone} onChange={e=>set('phone',e.target.value)}/></label>
 <label>E-Mail (optional)<input type="email" maxLength={254} autoComplete="email" value={data.email} onChange={e=>set('email',e.target.value)}/></label>
 <label>Adresse des Badezimmers *<input required maxLength={300} placeholder="Straße, PLZ und Ort" value={data.address} onChange={e=>set('address',e.target.value)}/></label>
 <label>Wunschtermin (optional)<input type="date" value={data.startDate} onChange={e=>set('startDate',e.target.value)}/></label>
 <label>Weitere Wünsche (optional)<textarea maxLength={1500} rows={3} value={data.notes} onChange={e=>set('notes',e.target.value)}/></label>
 <label className="lead-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={data.website} onChange={e=>set('website',e.target.value)}/></label>
 <label className="lead-consent"><input required type="checkbox" checked={data.consent} onChange={e=>set('consent',e.target.checked)}/><span>Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage zu. Vor der öffentlichen Nutzung muss Norde die vollständigen Datenschutzhinweise bereitstellen.</span></label>
 {error&&<p role="alert" className="lead-error"><CircleAlert size={16}/>{error}</p>}
 <button disabled={busy} type="submit">{busy?'Wird gespeichert …':'Unverbindliche Anfrage senden'} <ArrowRight size={18}/></button>
 </form>
 <small>Testsystem: Nur die Datenbank-Annahme wird bestätigt, nicht der E-Mail-Versand. Bitte verwenden Sie bis zur Produktionsfreigabe ausschließlich Beispieldaten.</small>
 </section>;
}
