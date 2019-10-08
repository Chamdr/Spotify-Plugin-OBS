const { app, BrowserWindow, Tray, Menu } = require('electron')
const Registry = require('rage-edit').Registry
const querystring = require('querystring')
const request = require("request")
const express = require("express")
const slash = require("slash")
const path = require("path")
const fs = require("fs")

const client_id = "bf05f03c90364683a6ff33ba75ab909a"
const client_secret = "9ba17feecc2c4beb961a9a092fe60f48"
const version = "1.2.1"

const redirect_uri = "http://localhost:1764/callback"

let http = express()
http.use(express.static("../plugin/public"))
let state
let win
let refresh_token
let access_token

function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        },
        icon: path.join(__dirname, "icon.png"),
        autoHideMenuBar: true
    })
    request("https://api.github.com/repos/DrakLulu/Spotify-Plugin-OBS/releases/latest", {
        headers: {
            "User-Agent": "Spotify-Plugin-OBS"
        }
    }, (error, response, body) => {
        body = JSON.parse(body)
        releaseVersion = body.tag_name.slice(1)
        if (version !== releaseVersion) {
            new BrowserWindow({
                width: 450,
                height: 200,
                webPreferences: {
                    nodeIntegration: true
                },
                icon: path.join(__dirname, "icon.png"),
                autoHideMenuBar: true
            }).loadFile(path.join(__dirname, "update.html"))
        }
    })
    const scope = "user-read-currently-playing"
    state = generateRandomString(16)
    win.loadURL('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
            show_dialog: true
        }))
    let tray = new Tray(path.join(__dirname, "icon.png"))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: function () {
                win.show();
            }
        },
        {
            label: "Démarrer automatiquement",
            type: "checkbox",
            click: function () {
                Registry.get("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "SpotifyPluginObs").then((result) => {
                    if (result === undefined) {
                        Registry.set("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "SpotifyPluginObs", path.join(__dirname, "..", "..", "..", "Spotify-Plugin-OBS.exe"))
                    } else {
                        Registry.delete("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "SpotifyPluginObs")
                    }
                })
            }
        },
        {
            label: 'Quit',
            click: function () {
                app.isQuiting = true;
                app.quit();
                app.exit()
            }
        }
    ]);

    Registry.get("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "SpotifyPluginObs").then((result) => {
        const value = result !== undefined
        contextMenu.items[1].checked = value ? true : false
    })
    tray.setContextMenu(contextMenu)

    win.on('close', function (event) {
        event.preventDefault();
        win.hide();
    });
    win.on('minimize', function (event) {
        event.preventDefault()
        win.hide()
    })

    win.on('show', function () {
        tray.setHighlightMode('always')
    })
}

app.on('ready', () => {
    createWindow()
})

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

http.get('/callback', function (req, res) {
    const code = req.query.code || null;
    const queryState = req.query.state || null;

    if (queryState === null || queryState !== state) {
        //handle error
    } else {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                access_token = body.access_token
                refresh_token = body.refresh_token

                res.sendFile(path.join(__dirname, "index.html"))
            }
        });
    }
});

http.get("/url", (req, res) => {
    res.send(slash(path.join(__dirname, "..", "plugin", "index.html")))
})

http.get("/plugin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "plugin", "index.html"))
})

http.get("/token", (req, res) => {
    res.send(access_token)
})
http.get("/icon.png", (req, res) => {
    res.sendFile(path.join(__dirname, "icon.png"))
})
setInterval(() => {
    if (refresh_token) {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                 access_token = body.access_token
            }
        })
    }
}, 30 * 60 * 1000)

console.log('Listening on 1764');
http.listen(1764);

function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};