"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const pathMatch = require("path-match");
const url = require("url");
const qs = require("qs");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const _ = require("underscore");
class ServerRouter {
    constructor() {
    }
    static processRequestToStatic(req, res, callback) {
        var filePath = path.join(_1.Server.staticPath, req.url.split('?')[0]);
        fs.stat(filePath, (err, stat) => {
            if (err) {
                res.writeHead(404);
                res.end();
                return callback(404);
            }
            if (stat.isDirectory())
                filePath = path.join(filePath, 'index.html');
            fs.exists(filePath, (exist) => {
                if (exist) {
                    res.writeHead(200, {
                        'Content-Type': mime.lookup(filePath).toString()
                    });
                    var readStream = fs.createReadStream(filePath);
                    readStream.pipe(res);
                    callback(200, filePath);
                }
                else {
                    res.writeHead(404);
                    res.end();
                    return callback(404);
                }
            });
        });
    }
    static findSrvRoute(req) {
        var parsedUrl = url.parse(req.url);
        var path = parsedUrl.pathname;
        // finding controller by path
        var srvRoute = _1.Server.routes.find((route) => {
            // Check if controller exist and requested method matches 
            if (route.method.toLowerCase() != req.method.toLowerCase())
                return false;
            var matcher = ServerRouter.routerPathMatcher(route.route);
            var params = matcher(path);
            if (params !== false) {
                req.query = qs.parse(parsedUrl.query);
                req.params = params;
                return true;
            }
            return false;
        });
        return srvRoute;
    }
    static executeRoute(srvRoute, req, res) {
        return new Promise((resolve, reject) => {
            // creating object from controllerClass 
            // Reason : basically because we need to run constructor
            var controllerObject = srvRoute.controllerObject;
            var actions = _.clone((controllerObject[srvRoute.endpoint].actions));
            if (controllerObject["onRequest"])
                actions.unshift(controllerObject["onRequest"]);
            _1.Server.middlewares.forEach((middle) => actions.unshift(middle));
            // starting from first action
            var actionIndex = 0;
            res.on('finish', () => resolve(actionIndex));
            var executeActions = function (passedModel) {
                var action;
                try {
                    action = actions[actionIndex](req, res, function _next(model) {
                        if (model)
                            if (model.constructor)
                                if (model.constructor.name == "ServerError") {
                                    reject(model);
                                    return;
                                }
                        // Execute next
                        actionIndex++;
                        if (actions.length == actionIndex) {
                            return resolve(model);
                        }
                        executeActions(model);
                    }, function _done(statusCode, statusMessage) {
                        res.statusCode = statusCode || 200;
                        res.statusMessage = statusMessage;
                        res.end();
                        resolve();
                    }, passedModel);
                }
                catch (error) {
                    reject(error);
                }
                if (action)
                    action.then((data) => {
                    }).catch((e) => {
                        reject(new _1.ServerError(500, e.message));
                    });
            };
            executeActions(null);
        });
    }
    static routeIt(req, res, srvRoute) {
        return new Promise((resolve, reject) => {
            if (_1.Server.opts.cors)
                res.setHeader('Access-Control-Allow-Origin', _1.Server.opts.cors);
            res.setHeader('Access-Control-Allow-Headers', 'clientid, Authorization, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
            res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
            if (req.method === 'OPTIONS') {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.statusCode = 200;
                res.end();
                resolve();
                return;
            }
            // Check if controller exist and requested method matches 
            if (!srvRoute) {
                var err = new _1.ServerError(404, `[${req.method.toUpperCase()} ${req.url}] route not found !`);
                return reject(err);
            }
            var authService = _1.Server.services["AuthService"];
            if (!authService)
                ServerRouter.executeRoute(srvRoute, req, res).then((data) => {
                    resolve(data);
                }).catch(e => {
                    reject(e);
                });
            else
                authService.findClientById(req.client()).then(client => {
                    if (client) {
                        var clientUrl = url.parse(client.url);
                        res.setHeader('Access-Control-Allow-Origin', clientUrl.protocol + '//' + clientUrl.host);
                    }
                    authService.authorizeRequest(req, srvRoute.controllerName, srvRoute.endpoint, srvRoute.publicAccess).then(() => {
                        ServerRouter.executeRoute(srvRoute, req, res).then((data) => {
                            resolve(data);
                        }).catch(e => {
                            reject(e);
                        });
                    }).catch((e) => {
                        reject(e);
                    });
                }).catch(e => { });
        });
    }
}
ServerRouter.routerPathMatcher = pathMatch({
    // path-to-regexp options 
    sensitive: false,
    strict: false,
    end: false,
});
exports.ServerRouter = ServerRouter;
