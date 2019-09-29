const packager = require('electron-packager')
const archiver = require("archiver")
const fs = require("fs")

if (fs.existsSync("Spotify-Plugin-OBS-win32-x64.zip")) { fs.unlinkSync("Spotify-Plugin-OBS-win32-x64.zip") }

packager({
    dir: ".",
    name: "Spotify-Plugin-OBS",
    platform: "win32",
    arch: "x64",
    prune: true,
    overwrite: true,
    icon: "icon.ico"
}).then((path) => {
    path = path[0]
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(path + ".zip");
    archive
        .directory(path, false)
        .pipe(stream)
    archive.finalize();
})

