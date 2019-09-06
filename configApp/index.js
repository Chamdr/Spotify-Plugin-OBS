const { app, BrowserWindow } = require('electron')
// Gardez une reference globale de l'objet window, si vous ne le faites pas, la fenetre sera
// fermee automatiquement quand l'objet JavaScript sera garbage collected.
let win

function createWindow() {
    // Créer le browser window.
    win = new BrowserWindow({
        /*width: 800,
        height: 600,*/
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadURL("https://google.fr")

    win.on('closed', () => {
        win = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})