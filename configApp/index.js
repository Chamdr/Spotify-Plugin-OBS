const { app, BrowserWindow } = require('electron')
const querystring = require('querystring')
const request = require("request")
const express = require("express")

const client_id = "bf05f03c90364683a6ff33ba75ab909a"
const client_secret = "9ba17feecc2c4beb961a9a092fe60f48"

const redirect_uri = "http://localhost:1764/callback"
let http = express()
let state
let win

function createWindow() {
    win = new BrowserWindow({
        /*width: 800,
        height: 600,*/
        webPreferences: {
            nodeIntegration: true
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
            state:state,
            show_dialog:true
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
        console.log("callback")
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

                res.send(`access token: ${access_token} \n refresh token: ${refresh_token}`)
            } else {
                //handle error
            }
        });
    }
});

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