#!/usr/bin/env python3
"""Bundle the built web app as one offline HTML for browsers and WKWebView."""
import base64, pathlib, re
root=pathlib.Path(__file__).resolve().parents[1]
dist=root/'dist'
html=(dist/'index.html').read_text()
js_path=re.search(r'<script[^>]*src="([^"]+)"[^>]*></script>',html).group(1)
css_path=re.search(r'<link[^>]*href="([^"]+\.css)"[^>]*>',html).group(1)
js=(dist/js_path.lstrip('/')).read_text()
js=re.sub(r'//# sourceMappingURL=.*','',js)
css=(dist/css_path.lstrip('/')).read_text()
for name in ['bathroom.svg','icon.svg']:
    uri='data:image/svg+xml;base64,'+base64.b64encode((root/'public'/name).read_bytes()).decode()
    js=js.replace('/'+name,uri)
    html=html.replace('/'+name,uri)
runtime=(root/'scripts/offline-runtime.js').read_text()
html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html)
html=re.sub(r'<link[^>]*href="[^"]+\.css"[^>]*>','',html)
html=re.sub(r'<link[^>]*rel="manifest"[^>]*>','',html)
html=html.replace('</head>','<style>'+css+'</style></head>')
html=html.replace('</body>','<script>'+runtime.replace('</script','<\\/script')+'</script><script type="module">'+js.replace('</script','<\\/script')+'</script></body>')
html='\n'.join(line.rstrip() for line in html.splitlines())+'\n'
output=root/'ios/Norde/Norde/Web/index.html'
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(html)
(root/'dist/Norde-Demo.html').write_text(html)
print('Offline browser and iOS demo generated:',len(html),'characters')
