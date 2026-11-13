# Gera public/index.html a partir da app (painel2.html) acrescentando o login Firebase.
import sys,re,shutil,os
src=sys.argv[1] if len(sys.argv)>1 else '../painel2.html'
s=open(src,encoding='utf8').read()
import time
V=time.strftime('%Y%m%d%H%M')
inj=('<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>'
     '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>'
     '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>'
     '<script src="firebase-config.js?v='+V+'"></script><script src="rafc.js?v='+V+'"></script>')
cab=('<title>Academia Rio Ave FC 360°</title><meta name="theme-color" content="#0b5a33"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png?v=2" sizes="180x180"><link rel="icon" type="image/png" href="icon-192.png?v=2"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Academia RAFC"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">')
assert s.startswith('<!doctype html>')
s=s.replace('<title>Academia Rio Ave FC 360°</title>','',1)
s=s.replace('</head>',cab+'</head>',1)
s=s.replace('<body>','<body>'+inj,1)
s=s.replace('<html>','<html lang="pt-PT">',1)
open('index.html','w',encoding='utf8').write(s)
print('ok',len(s))
