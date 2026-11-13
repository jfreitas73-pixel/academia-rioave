# Gera public/index.html a partir da app (painel2.html) acrescentando o login Firebase.
import sys,re,shutil,os
src=sys.argv[1] if len(sys.argv)>1 else '../painel2.html'
s=open(src,encoding='utf8').read()
inj=('<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>'
     '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>'
     '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>'
     '<script src="firebase-config.js"></script><script src="rafc.js"></script>'
     '<meta name="theme-color" content="#0b5a33"><link rel="manifest" href="manifest.webmanifest">')
assert s.startswith('<!doctype html>')
s=s.replace('<body>','<body>'+inj,1)
s=s.replace('<html>','<html lang="pt-PT">',1)
open('index.html','w',encoding='utf8').write(s)
print('ok',len(s))
