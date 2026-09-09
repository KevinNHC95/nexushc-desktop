const { app, BrowserWindow, shell, Menu } = require("electron")

// Coquille desktop NEXUS HC (2026-09) - une seule icone/appli installee (le Portail), qui
// charge la vraie page web. CRM et NOVA ne sont PAS des applis separees : on reste dans cette
// meme fenetre en naviguant vers leurs sous-domaines (voir setWindowOpenHandler/will-navigate
// ci-dessous) - c'est ce qui fait que "tout vit dans le Portail" cote utilisateur, sans rien
// dupliquer cote code (la vraie logique reste sur les 3 apps Next.js/Vercel existantes).
const PORTAIL_URL = "https://portail.nexushc.fr"
const DOMAINE_INTERNE = /(^|\.)nexushc\.fr$/

function estInterne(urlString) {
  try {
    return DOMAINE_INTERNE.test(new URL(urlString).hostname)
  } catch {
    return false
  }
}

function creerFenetre() {
  const fenetre = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "NEXUS HC",
    backgroundColor: "#012230",
    autoHideMenuBar: true, // menu classique (Alt pour le reveler) - recharger/devtools restent accessibles sans encombrer l'interface
    icon: __dirname + "/build/icon.ico",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Liens/redirections vers un AUTRE domaine que *.nexushc.fr (ex. une source citee dans un
  // resultat de veille) : ouverts dans le vrai navigateur par defaut, jamais dans cette fenetre.
  fenetre.webContents.on("will-navigate", (event, url) => {
    if (!estInterne(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // target="_blank" (ex. les tuiles NOVA/CRM du Portail) : reste dans CETTE fenetre pour les
  // sous-domaines nexushc.fr (pas de nouvelle fenetre/icone), sinon navigateur externe.
  fenetre.webContents.setWindowOpenHandler(({ url }) => {
    if (estInterne(url)) {
      fenetre.loadURL(url)
    } else {
      shell.openExternal(url)
    }
    return { action: "deny" }
  })

  fenetre.loadURL(PORTAIL_URL)
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.getApplicationMenu()) // garde le menu par defaut (reload/devtools/zoom), juste masque visuellement
  creerFenetre()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
