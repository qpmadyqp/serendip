import { ServerMiddlewareInterface } from "./ServerMiddlewareInterface";
import { ServerServiceInterface } from "..";

export interface ServerOptionsInterface {

    services?: any;
    controllers?: any;
    middlewares?: [ServerMiddlewareInterface]
    httpPort?: number;
    httpsPort?: number;
    cpuCores?: number | string;
    staticPath?: string;
    cert?: string;
    key?: string;
    httpsOnly?: boolean;
    cors?: string;
    devMode?: boolean;
}