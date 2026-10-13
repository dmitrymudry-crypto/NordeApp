import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLead,LEAD_STATUSES} from '../src/lead-schema.js';

const sample=()=>({
 name:'Max Muster',phone:'+49 170 1234567',email:'max@example.test',
 address:'Musterstraße 11, 10115 Berlin',notes:'',startDate:'',photos:[],
 consent:true,clientRequestId:'demo-test-1',
 configuration:{area:5,equipment:'Bodengleiche Dusche',extras:['LED-Spiegel']}
});
test('lead quote is recalculated from the configured gross catalogue',()=>{
 const result=validateLead({...sample(),quote:{total:1}});
 assert.equal(result.quote.total,13199);
 assert.equal(result.quote.gross,true);
 assert.equal(result.quote.nonBinding,true);
});
test('lead cannot invent upgrade prices or equipment',()=>{
 assert.throws(()=>validateLead({...sample(),configuration:{area:5,equipment:'Invented',extras:[]}}));
 assert.throws(()=>validateLead({...sample(),configuration:{area:5,equipment:'Bodengleiche Dusche',extras:['Secret discount']}}));
});
test('large bathrooms receive individual estimate without misleading total',()=>{
 assert.equal(validateLead({...sample(),configuration:{area:8,equipment:'Bodengleiche Dusche',extras:[]}}).quote.total,null);
});
test('lead requires consent and contact details',()=>{
 assert.throws(()=>validateLead({...sample(),consent:false}));
 assert.throws(()=>validateLead({...sample(),phone:'nonsense'}));
});
test('duplicate extras are only charged once',()=>{
 assert.equal(validateLead({...sample(),configuration:{area:5,equipment:'Bodengleiche Dusche',extras:['LED-Spiegel','LED-Spiegel']}}).quote.total,13199);
});
test('known status values include the new inbox stages',()=>{assert.ok(LEAD_STATUSES.includes('Neu'));assert.ok(LEAD_STATUSES.includes('Beauftragt'));});
