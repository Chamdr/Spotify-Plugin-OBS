const { app, BrowserWindow, Tray, Menu } = require('electron')
const querystring = require('querystring')
const request = require("request")
const express = require("express")
const path = require("path")
const slash = require("slash")
const fs = require("fs")

const client_id = "bf05f03c90364683a6ff33ba75ab909a"
const client_secret = "9ba17feecc2c4beb961a9a092fe60f48"

const redirect_uri = "http://localhost:1764/callback"
let http = express()
http.use(express.static("public"))
let state
let win
let refresh_token
let access_token

function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 800,
        webPreferences: {
            nodeIntegration: false
        },
        autoHideMenuBar: true
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
    let tray = new Tray(path.join(__dirname, "..", "plugin", "image.png"))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                win.show();
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    // Appelé à nouveau pour Linux car nous avons modifié le menu contextuel
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
    res.sendFile(path.join("..", "plugin", "index.html"))
})

http.get("/token", (req, res) => {
    res.send(access_token)
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
                const access_token = body.access_token;
                const obj = {
                    token: access_token
                }
                console.log(access_token)
                fs.writeFile(path.join(__dirname, "..", "plugin", "config.json"), JSON.stringify(obj), (err) => { if (err) console.error(err) })
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