const { app, BrowserWindow } = require('electron')
const querystring = require('querystring')
const request = require("request")
const express = require("express")
const path = require("path")
const fs = require("fs")

const client_id = "bf05f03c90364683a6ff33ba75ab909a"
const client_secret = "9ba17feecc2c4beb961a9a092fe60f48"

const redirect_uri = "http://localhost:1764/callback"
let http = express()
http.use(express.static("public"))
let state
let win

function createWindow() {
    win = new BrowserWindow({
        width: 500,
        height: 750,
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
            show_dialog: false
        }))

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

                const access_token = body.access_token
                const refresh_token = body.refresh_token

                console.log(`access token: ${access_token}`)
                console.log(`refresh token: ${refresh_token}`)
                const obj = {
                    url: path.join(__dirname, "..", "plugin", "index.html"),
                    refresh_token: refresh_token
                }
                fs.writeFile(path.join(__dirname, "..", "plugin", "config.json"), JSON.stringify(obj), (err) => { if (err) console.error(err) })
                res.sendFile(path.join(__dirname, "index.html"))
            } else {
                //handle error
            }
        });
    }
});

http.get("/url", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "plugin", "config.json"))
})

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