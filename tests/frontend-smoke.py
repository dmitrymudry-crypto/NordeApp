"""Browser QA for the standalone frontend. Requires Python Playwright + Chromium.
Run against a local server serving web-demo/. Optional --axe points to axe.min.js.
"""
import argparse, pathlib, json, base64
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--url',default='http://127.0.0.1:3095/');ap.add_argument('--axe');ap.add_argument('--screenshots',default='/tmp/norde-frontend-screenshots');args=ap.parse_args()
shots=pathlib.Path(args.screenshots);shots.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
 context.add_init_script("Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true})")
 page=context.new_page();errors=[];network=[];violations=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda msg:errors.append('Console '+msg.type+': '+msg.text) if msg.type in ['error','warning'] else None)
 page.on('request',lambda r:network.append(r.url))
 def axe(screen):
  if not args.axe:return
  page.add_script_tag(path=args.axe)
  result=page.evaluate("async () => (await axe.run(document, {runOnly: {type:'tag', values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))")
  if result:violations.append({'screen':screen,'violations':result})
 def step(n):page.get_by_role('button',name=f'Schritt {n}:',exact=False).click()
 def nav(name):page.get_by_role('navigation',name='Hauptmenü').get_by_role('button',name=name,exact=True).click()
 def total(n):assert page.locator('.mobile-estimate strong').inner_text().replace('\u00a0',' ')==f'{n:,}'.replace(',','.')+' €'
 page.goto(args.url);page.get_by_role('button',name='Mein Bad konfigurieren',exact=True).wait_for()
 assert page.locator('.bottom-nav').count()==0
 axe('onboarding');page.screenshot(path=str(shots/'mobile-welcome.png'),full_page=True)
 page.get_by_role('button',name='Mein Bad konfigurieren',exact=True).click()
 total(12949);assert page.locator('.bottom-nav button').count()==4
 assert page.get_by_role('dialog').count()==0
 axe('dimensions');page.screenshot(path=str(shots/'mobile-configurator.png'),full_page=True)
 page.get_by_label('Badfläche (m²)',exact=True).fill('0')
 assert page.locator('.mobile-estimate button').is_disabled()
 assert page.get_by_role('alert').count()==1
 page.get_by_role('button',name='8 m²',exact=True).click()
 assert page.locator('.mobile-estimate strong').inner_text()=='Auf Anfrage'
 page.get_by_role('button',name='5 m²',exact=True).click();total(12949)
 step(2);page.get_by_role('button',name='Badewanne statt Dusche',exact=False).click();total(12949)
 step(3);page.get_by_role('button',name='LED-Spiegel',exact=False).click();total(13199)
 step(5);page.get_by_role('button',name='LED-Spiegel',exact=False).click();total(12949)
 page.get_by_role('button',name='Fußbodenheizung',exact=False).click();total(13849)
 page.get_by_role('button',name='LED-Spiegel',exact=False).click();total(14099)
 page.get_by_role('button',name='Fußbodenheizung',exact=False).click();total(13199)
 step(3);assert page.get_by_role('button',name='LED-Spiegel',exact=False).get_attribute('aria-pressed')=='true'
 page.get_by_role('button',name='Doppelwaschtisch',exact=False).click()
 assert page.locator('.mobile-estimate strong').inner_text()=='Auf Anfrage'
 page.get_by_role('button',name='Waschtisch mit Unterschrank',exact=False).click();total(13199)
 step(4);page.get_by_role('button',name='Steingrau',exact=False).click()
 page.get_by_role('button',name='Großformat',exact=False).click()
 assert page.locator('.mobile-estimate strong').inner_text()=='Auf Anfrage'
 page.get_by_role('button',name='60 × 60 cm',exact=False).click();total(13199)
 axe('materials');page.screenshot(path=str(shots/'mobile-materials.png'),full_page=True)
 step(6);assert 'Steingrau' in page.locator('.configuration-summary').inner_text()
 axe('summary')
 page.locator('.mobile-estimate button').click()
 page.get_by_role('heading',name='Erzählen Sie uns von Ihrem Bad.',exact=True).wait_for()
 assert page.get_by_role('dialog').count()==0
 assert 'Steingrau' in page.locator('.inquiry-summary').inner_text()
 page.get_by_label('Name',exact=False).fill('Demo Kunde')
 page.get_by_label('Telefon',exact=False).fill('not a phone')
 page.get_by_label('Projektadresse',exact=False).fill('Beispielweg 1, Berlin')
 page.get_by_role('checkbox').check()
 page.get_by_role('button',name='Demo-Anfrage speichern',exact=True).click()
 assert page.get_by_role('alert').count()==1
 page.get_by_label('Telefon',exact=False).fill('+49 123456789')
 image=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jElcAAAAASUVORK5CYII=')
 page.get_by_label('Badfotos hochladen',exact=True).set_input_files({'name':'test.png','mimeType':'image/png','buffer':image})
 page.get_by_alt_text('Badfoto 1',exact=True).wait_for()
 axe('inquiry');page.screenshot(path=str(shots/'mobile-inquiry.png'),full_page=True)
 page.get_by_role('button',name='Zurück zur Konfiguration',exact=True).click();total(13199)
 assert page.get_by_role('button',name='Schritt 6: Übersicht',exact=True).get_attribute('aria-current')=='step'
 page.locator('.mobile-estimate button').click()
 assert page.get_by_label('Name',exact=False).input_value()=='Demo Kunde'
 assert page.get_by_alt_text('Badfoto 1',exact=True).count()==1
 page.get_by_role('button',name='Demo-Anfrage speichern',exact=True).click()
 page.get_by_role('heading',name='Ihre Idee nimmt Form an.',exact=True).wait_for()
 assert 'Es wurde keine E-Mail versendet' in page.locator('body').inner_text()
 assert len(page.evaluate("JSON.parse(localStorage.getItem('norde-demo-inquiries-v1'))"))==1
 axe('confirmation')
 page.get_by_role('button',name='Zur Übersicht',exact=True).click()
 nav('Bad konfigurieren');step(4)
 assert page.get_by_role('button',name='Steingrau',exact=False).get_attribute('aria-pressed')=='true'
 page.reload();nav('Bad konfigurieren');total(13199)
 print('PASS pricing arithmetic, standard bath included, quote-only states, state persistence, guest inquiry, photo preview and simulated confirmation')
 nav('Profil');page.get_by_role('button',name='Team-Demo öffnen',exact=True).click()
 nav('Profil');page.get_by_role('button',name='Neue Anfragen',exact=True).click()
 page.get_by_role('heading',name='Demo Kunde',exact=True).wait_for()
 page.get_by_label('Demo-Status für Demo Kunde',exact=False).select_option('Besichtigung')
 assert page.get_by_label('Demo-Status für Demo Kunde',exact=False).input_value()=='Besichtigung'
 nav('Meine Projekte');page.get_by_role('button',name='Alex Beispiel · Badsanierung',exact=False).click()
 page.get_by_role('button',name='Angebote & Rechnungen',exact=False).click()
 page.get_by_role('heading',name='1. Abschlagsrechnung',exact=True).wait_for()
 axe('project documents')
 nav('Profil');page.get_by_role('button',name='Fliesenpause',exact=True).click()
 page.get_by_role('button',name='Spiel starten',exact=True).click();page.wait_for_timeout(1450)
 assert page.get_by_text('010',exact=True).count()>0
 page.get_by_role('button',name='Pause',exact=True).click()
 print('PASS local staff inbox, project documents and mini-game regressions')
 for width,height in [(360,800),(390,844),(768,1024),(1440,1000)]:
  page.set_viewport_size({'width':width,'height':height});nav('Bad konfigurieren');step(4)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  if width>=1000:
   assert page.locator('.estimate-panel').is_visible()
   assert not page.locator('.mobile-estimate').is_visible()
   page.screenshot(path=str(shots/'desktop-configurator.png'),full_page=True)
  else:
   assert page.locator('.mobile-estimate').is_visible()
   assert not page.locator('.estimate-panel').is_visible()
  nav('Start');assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
  if width==1440:page.screenshot(path=str(shots/'desktop-home.png'),full_page=True)
  nav('Profil');assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
 print('PASS responsive 360/390/768/1440, persistent desktop summary and mobile price panel')
 page.set_viewport_size({'width':390,'height':844});nav('Bad konfigurieren');step(4)
 page.keyboard.press('Tab')
 assert page.evaluate('document.activeElement !== document.body')
 assert not errors,errors
 assert all(r==args.url or r.startswith('blob:') or r.startswith('data:') for r in network),network
 print('PASS keyboard focus, no runtime errors, no API/external network calls')
 if args.axe:
  (shots/'accessibility.json').write_text(json.dumps(violations,ensure_ascii=False,indent=2))
  print('Accessibility violations:',sum(len(s['violations']) for s in violations))
  for screen in violations:print(json.dumps(screen,ensure_ascii=False))
  assert not violations, 'Accessibility audit found violations; see accessibility.json'
 regression=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
 regression.add_init_script("localStorage.setItem('norde-intro-v2','done');localStorage.setItem('norde-bath-config-v1',JSON.stringify({area:null,equipment:'invalid',extras:['unknown'],material:'invalid'}));")
 restored=regression.new_page();restored.on('pageerror',lambda e:errors.append(str(e)));restored.goto(args.url)
 restored.get_by_role('navigation',name='Hauptmenü').get_by_role('button',name='Bad konfigurieren',exact=True).click()
 assert restored.locator('.mobile-estimate strong').inner_text().replace('\u00a0',' ')=='12.949 €'
 assert restored.get_by_label('Badfläche (m²)',exact=True).input_value()=='5'
 assert not errors,errors
 print('PASS malformed saved configuration restores safe defaults')
 regression.close()
 browser.close()
