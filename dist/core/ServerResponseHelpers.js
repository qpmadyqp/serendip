"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Path = require("path");
function ServerResponseHelpers(res) {
    res.sendFile = (path) => {
        // maps file extention to MIME types
        const mimeType = {
            '.ico': 'image/x-icon',
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.eot': 'appliaction/vnd.ms-fontobject',
            '.ttf': 'aplication/font-sfnt'
        };
        fs.exists(path, function (exist) {
            if (!exist) {
                // if the file is not found, return 404
                res.statusCode = 404;
                res.end(`File ${path} not found!`);
                return;
            }
            // read file from file system
            fs.readFile(path, function (err, data) {
                if (err) {
                    res.statusCode = 500;
                    res.end(`Error getting the file: ${err}.`);
                }
                else {
                    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
                    const ext = Path.parse(path).ext;
                    // if the file is found, set Content-type and send data
                    res.setHeader('Content-type', mimeType[ext] || 'application/octet-stream');
                    res.setHeader("content-disposition", "attachment; filename=\"" + Path.parse(path).base + "\"");
                    res.end(data);
                }
            });
        });
    };
    res.send = (data) => {
        res.write(data);
        res.end();
    };
    res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
    };
    return res;
}
exports.ServerResponseHelpers = ServerResponseHelpers;
