"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const debug_1 = __importDefault(require("debug"));
const node_opcua_1 = require("node-opcua");
const nodeOPCUANodesets = __importStar(require("node-opcua-nodesets"));
const requireResolve = require.resolve("node-opcua-server");
const opcuaServerDebug = (0, debug_1.default)("opcuaCompact:server");
const opcuaServerDetailsDebug = (0, debug_1.default)("opcuaCompact:server:details");
const opcuaErrorDebug = (0, debug_1.default)("opcuaCompact:error");
const listenForErrors = (node) => {
    node.on("error", (err) => {
        opcuaErrorDebug(err);
    });
};
const setNodeStatus = (node, options) => {
    node.status(options);
};
const isWindows = () => process.platform === "win32";
const checkUserLogon = () => true;
const getPackagePathFromIndex = () => {
    if (isWindows()) {
        return requireResolve.replace("\\index.js", "");
    }
    else {
        return requireResolve.replace("/index.js", "");
    }
};
const serverCertificateFile = (keybits) => {
    return path.join(__dirname, "../../certificates/server_selfsigned_cert_" + keybits + ".pem");
};
const serverKeyFile = (keybits) => {
    return path.join(__dirname, "../../certificates/server_key_" + keybits + ".pem");
};
const coreServerModule = {
    nodeOpcuaServer: require("node-opcua-server/dist/opcua_server"),
    opcua: require("node-opcua"),
    debugLog: opcuaServerDebug,
    detailLog: opcuaServerDetailsDebug,
    errorLog: opcuaErrorDebug,
    readConfigOfServerNode: (node, config) => {
        node.port = config.port;
        node.endpoint = config.endpoint;
        node.productUri = config.productUri;
        node.alternateHostname = config.alternateHostname;
        node.maxAllowedSessionNumber = config.maxAllowedSessionNumber;
        node.maxConnectionsPerEndpoint = config.maxConnectionsPerEndpoint;
        node.maxAllowedSubscriptionNumber = config.maxAllowedSubscriptionNumber;
        node.maxNodesPerRead = config.maxNodesPerRead;
        node.maxNodesPerWrite = config.maxNodesPerWrite;
        node.maxNodesPerHistoryReadData = config.maxNodesPerHistoryReadData;
        node.maxNodesPerBrowse = config.maxNodesPerBrowse;
        node.maxBrowseContinuationPoints = config.maxBrowseContinuationPoints;
        node.maxHistoryContinuationPoints = config.maxHistoryContinuationPoints;
        node.delayToInit = config.delayToInit;
        node.delayToClose = config.delayToClose;
        node.serverShutdownTimeout = config.serverShutdownTimeout;
        node.showStatusActivities = config.showStatusActivities;
        node.showErrors = config.showErrors;
        node.publicCertificateFile = config.publicCertificateFile;
        node.privateCertificateFile = config.privateCertificateFile;
        node.allowAnonymous = config.allowAnonymous;
        node.opcuaUsers = config.users;
        node.xmlsetsOPCUA = config.xmlsetsOPCUA;
        node.isAuditing = config.isAuditing;
        node.disableDiscovery = !config.serverDiscovery;
        node.registerServerMethod = config.registerServerMethod;
        node.discoveryServerEndpointUrl = config.discoveryServerEndpointUrl;
        node.capabilitiesForMDNS = config.capabilitiesForMDNS
            ? config.capabilitiesForMDNS.split(",")
            : [config.capabilitiesForMDNS];
        return node;
    },
    initialize: (node, options) => {
        return new node_opcua_1.OPCUAServer(options);
    },
    stop: (node, server, done) => {
        server.shutdown(node.serverShutdownTimeout || 1000, done);
    },
    getRegisterServerMethod: (id) => {
        return node_opcua_1.RegisterServerMethod[id];
    },
    loadOPCUANodeSets: (node, dirname) => {
        const xmlFiles = [
            nodeOPCUANodesets.nodesets.standard,
            nodeOPCUANodesets.nodesets.di,
        ];
        if (Array.isArray(node.xmlsetsOPCUA)) {
            node.xmlsetsOPCUA.forEach((xmlsetFileName) => {
                if (xmlsetFileName.path) {
                    if (xmlsetFileName.path.startsWith("public/vendor/")) {
                        xmlFiles.push(path.join(dirname, xmlsetFileName.path));
                    }
                    else {
                        xmlFiles.push(xmlsetFileName.path);
                    }
                }
            });
            opcuaServerDetailsDebug("appending xmlFiles: " + xmlFiles.toString());
        }
        opcuaServerDetailsDebug("node sets:" + xmlFiles.toString());
        return xmlFiles;
    },
    defaultServerOptions: (node) => {
        const certificateFile = node.publicCertificateFile || serverCertificateFile("2048");
        const privateKeyFile = node.privateCertificateFile || serverKeyFile("2048");
        const registerServerMethod = 1;
        return {
            port: typeof node.port === "string" ? parseInt(node.port) : node.port || 4334,
            resourcePath: node.endpoint || "/UA/NodeRED/Compact",
            buildInfo: {
                productName: "Node-RED OPC UA Compact Server",
                buildNumber: "20240927",
                buildDate: new Date(2022, 9, 27),
            },
            serverCapabilities: {
                maxSessions: node.maxAllowedSessionNumber || 10,
                maxBrowseContinuationPoints: node.maxBrowseContinuationPoints || 10,
                maxHistoryContinuationPoints: node.maxHistoryContinuationPoints || 10,
                operationLimits: {
                    maxNodesPerRead: node.maxNodesPerRead || 1000,
                    maxNodesPerWrite: node.maxNodesPerWrite || 1000,
                    maxNodesPerHistoryReadData: node.maxNodesPerHistoryReadData || 100,
                    maxNodesPerBrowse: node.maxNodesPerBrowse || 1000,
                },
            },
            serverInfo: {
                productUri: node.productUri || "NodeOPCUA-Server-" + node.port,
                applicationName: { text: "NodeRED-Compact", locale: "en" },
                gatewayServerUri: null,
                discoveryProfileUri: null,
                discoveryUrls: [],
            },
            alternateHostname: node.alternateHostname,
            maxConnectionsPerEndpoint: node.maxConnectionsPerEndpoint || 10,
            allowAnonymous: node.allowAnonymous !== false,
            certificateFile,
            privateKeyFile,
            userManager: {
                isValidUser: checkUserLogon,
            },
            isAuditing: node.isAuditing || false,
            disableDiscovery: node.disableDiscovery || false,
            registerServerMethod,
            securityPolicies: [node_opcua_1.SecurityPolicy.None, node_opcua_1.SecurityPolicy.Basic256Sha256],
            securityModes: [
                node_opcua_1.MessageSecurityMode.None,
                node_opcua_1.MessageSecurityMode.Sign,
                node_opcua_1.MessageSecurityMode.SignAndEncrypt,
            ],
        };
    },
    constructAddressSpaceFromScript: (server, constructAddressSpaceScript, opcua, eventObjects, done) => {
        return new Promise((resolve, reject) => {
            try {
                const addressSpace = server.engine.addressSpace;
                if (!addressSpace) {
                    reject(new Error("Address space not available"));
                    return;
                }
                constructAddressSpaceScript(server, addressSpace, opcua, eventObjects, resolve);
            }
            catch (err) {
                reject(err);
            }
        });
    },
    postInitialize: (node, opcuaServer) => {
        if (!node.contribOPCUACompact) {
            node.contribOPCUACompact = {};
        }
        node.contribOPCUACompact.eventObjects = {};
        const addressSpace = opcuaServer.engine?.addressSpace || null;
        if (addressSpace) {
            addressSpace.getOwnNamespace();
        }
        if (node.contribOPCUACompact.constructAddressSpaceScript) {
            coreServerModule
                .constructAddressSpaceFromScript(opcuaServer, node.contribOPCUACompact.constructAddressSpaceScript, coreServerModule.opcua, node.contribOPCUACompact.eventObjects, () => { })
                .then(() => {
                setNodeStatus(node, { fill: "green", shape: "dot", text: "active" });
                node.emit("server_running");
            })
                .catch((err) => {
                setNodeStatus(node, { fill: "red", shape: "dot", text: err.message });
                node.emit("server_start_error");
            });
        }
    },
    run: (node, server) => {
        return new Promise((resolve, reject) => {
            server.start((err) => {
                if (err) {
                    opcuaErrorDebug("Server failed to start:", err);
                    reject(err);
                }
                else {
                    if (server.endpoints && server.endpoints.length) {
                        server.endpoints.forEach((endpoint) => {
                            endpoint.endpointDescriptions().forEach((endpointDescription) => {
                                opcuaServerDebug("Server endpointUrl: " +
                                    endpointDescription.endpointUrl +
                                    " securityMode: " +
                                    endpointDescription.securityMode.toString() +
                                    " securityPolicyUri: " +
                                    (endpointDescription.securityPolicyUri
                                        ? endpointDescription.securityPolicyUri.toString()
                                        : "None Security Policy Uri"));
                            });
                        });
                        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
                        opcuaServerDebug("Primary Server Endpoint URL " + endpointUrl);
                    }
                    server.on("newChannel", (channel) => {
                        opcuaServerDebug(`Client connected with address = ${channel.remoteAddress} port = ${channel.remotePort}`);
                    });
                    server.on("closeChannel", (channel) => {
                        opcuaServerDebug(`Client disconnected with address = ${channel.remoteAddress} port = ${channel.remotePort}`);
                    });
                    server.on("create_session", (session) => {
                        opcuaServerDebug("############## SESSION CREATED ##############");
                        if (session.clientDescription) {
                            opcuaServerDetailsDebug(`Client application URI: ${session.clientDescription.applicationUri}`);
                            opcuaServerDetailsDebug(`Client product URI: ${session.clientDescription.productUri}`);
                            opcuaServerDetailsDebug(`Client application name: ${session.clientDescription.applicationName
                                ? session.clientDescription.applicationName.toString()
                                : "none application name"}`);
                            opcuaServerDetailsDebug(`Client application type: ${session.clientDescription.applicationType
                                ? session.clientDescription.applicationType.toString()
                                : "none application type"}`);
                        }
                        opcuaServerDebug(`Session name: ${session.sessionName
                            ? session.sessionName.toString()
                            : "none session name"}`);
                        opcuaServerDebug(`Session timeout: ${session.sessionTimeout}`);
                        opcuaServerDebug(`Session id: ${session.getSessionId()}`);
                    });
                    server.on("session_closed", (session, reason) => {
                        opcuaServerDebug("############## SESSION CLOSED ##############");
                        opcuaServerDetailsDebug(`reason: ${reason}`);
                        opcuaServerDetailsDebug(`Session name: ${session.sessionName
                            ? session.sessionName.toString()
                            : "none session name"}`);
                    });
                    opcuaServerDebug("Server Initialized");
                    if (server.serverInfo) {
                        opcuaServerDetailsDebug(`Server Info: ${JSON.stringify(server.serverInfo)}`);
                    }
                    resolve();
                }
            });
        });
    },
    listenForErrors,
    setStatusPending: (node) => setNodeStatus(node, { fill: "yellow", shape: "ring", text: "pending" }),
    setStatusInit: (node) => setNodeStatus(node, { fill: "yellow", shape: "dot", text: "init" }),
    setStatusActive: (node) => setNodeStatus(node, { fill: "green", shape: "dot", text: "active" }),
    setStatusClosed: (node) => setNodeStatus(node, { fill: "yellow", shape: "ring", text: "closed" }),
    setStatusError: (node, text) => setNodeStatus(node, { fill: "red", shape: "dot", text }),
    isWindows,
    checkUserLogon,
    getPackagePathFromIndex,
    serverCertificateFile,
    serverKeyFile,
};
exports.default = coreServerModule;
