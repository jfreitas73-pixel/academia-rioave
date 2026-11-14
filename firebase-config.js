/* Configuração pública da app web do Firebase (não é segredo: identifica o projeto). */
window.RAFC_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDxPQpszSux_5zWz6pBF3kduTM_pb8gz4E",
  authDomain: "academia-rioave.firebaseapp.com",
  projectId: "academia-rioave",
  storageBucket: "academia-rioave.firebasestorage.app",
  messagingSenderId: "845154358905",
  appId: "1:845154358905:web:af7b5505f1c83c402aa6a8"
};

/* Fora do GitHub Pages (Vercel ou domínio próprio), o login da Google passa pelo próprio endereço do site
   (a Vercel encaminha /__/auth para o Firebase), o que funciona em qualquer browser. */
(function(){var h=location.hostname;if(!/github\.io$|^localhost$|^127\./.test(h))window.RAFC_FIREBASE_CONFIG.authDomain=location.host;})();
