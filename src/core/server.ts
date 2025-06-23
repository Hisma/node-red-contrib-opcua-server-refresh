/**
 MIT License
 Copyright (c) 2018-2022 Klaus Landsdorf (http://node-red.plus/)
 Copyright (c) 2019 Sterfive (https://www.sterfive.com/)
 Updated by Richard Meyer 2024
 **/
"use strict";

import * as path from "path";
import debug from "debug";
import {
  OPCUAServer,
  SecurityPolicy,
  MessageSecurityMode,
  RegisterServerMethod,
  AddressSpace,
} from "node-opcua";
import * as nodeOPCUANodesets from "node-opcua-nodesets";
import { NodeRedNode, NodeStatus } from "../types/node-red";
import {
  ServerOptions,
  CoreServerModule,
  AddressSpaceScript,
} from "../types/opcua-server";

const requireResolve = require.resolve("node-opcua-server");

// Debug loggers
const opcuaServerDebug = debug("opcuaCompact:server");
const opcuaServerDetailsDebug = debug("opcuaCompact:server:details");
const opcuaErrorDebug = debug("opcuaCompact:error");

// Helper functions
const listenForErrors = (node: NodeRedNode): void => {
  node.on("error", (err: Error) => {
    opcuaErrorDebug(err);
  });
};

const setNodeStatus = (node: NodeRedNode, options: NodeStatus): void => {
  node.status(options);
};

// Security functions
const isWindows = (): boolean => process.platform === "win32";

const checkUserLogon = (): boolean => true;

const getPackagePathFromIndex = (): string => {
  if (isWindows()) {
    return requireResolve.replace("\\index.js", "");
  } else {
    return requireResolve.replace("/index.js", "");
  }
};

const serverCertificateFile = (keybits: string): string => {
  return path.join(
    __dirname,
    "../../certificates/server_selfsigned_cert_" + keybits + ".pem"
  );
};

const serverKeyFile = (keybits: string): string => {
  return path.join(
    __dirname,
    "../../certificates/server_key_" + keybits + ".pem"
  );
};

const coreServerModule: CoreServerModule = {
  // Use OPCUAServer directly from node-opcua
  nodeOpcuaServer: require("node-opcua-server/dist/opcua_server"),

  // Export opcua (node-opcua module)
  opcua: require("node-opcua"),

  debugLog: opcuaServerDebug,
  detailLog: opcuaServerDetailsDebug,
  errorLog: opcuaErrorDebug,

  readConfigOfServerNode: (node: NodeRedNode, config: any): NodeRedNode => {
    /***
     * read config from user input from node-red
     */
    // network
    node.port = config.port;
    node.endpoint = config.endpoint;
    node.productUri = config.productUri;
    node.alternateHostname = config.alternateHostname;

    // limits
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

    // certificates
    node.publicCertificateFile = config.publicCertificateFile;
    node.privateCertificateFile = config.privateCertificateFile;

    // Security
    node.allowAnonymous = config.allowAnonymous;
    // User Management
    node.opcuaUsers = config.users;
    // XML-Set Management
    node.xmlsetsOPCUA = config.xmlsetsOPCUA;
    // Audit
    node.isAuditing = config.isAuditing;

    // discovery
    node.disableDiscovery = !config.serverDiscovery;
    node.registerServerMethod = config.registerServerMethod;
    node.discoveryServerEndpointUrl = config.discoveryServerEndpointUrl;

    /* istanbul ignore next */
    node.capabilitiesForMDNS = config.capabilitiesForMDNS
      ? config.capabilitiesForMDNS.split(",")
      : [config.capabilitiesForMDNS];

    return node;
  },

  initialize: (node: NodeRedNode, options: ServerOptions): OPCUAServer => {
    return new OPCUAServer(options);
  },

  stop: (node: NodeRedNode, server: OPCUAServer, done: () => void): void => {
    server.shutdown(node.serverShutdownTimeout || 1000, done);
  },

  getRegisterServerMethod: (id: number): any => {
    return RegisterServerMethod[id];
  },

  loadOPCUANodeSets: (node: NodeRedNode, dirname: string): string[] => {
    const xmlFiles: string[] = [
      nodeOPCUANodesets.nodesets.standard,
      nodeOPCUANodesets.nodesets.di,
    ];

    if (Array.isArray(node.xmlsetsOPCUA)) {
      node.xmlsetsOPCUA.forEach((xmlsetFileName) => {
        if (xmlsetFileName.path) {
          if (xmlsetFileName.path.startsWith("public/vendor/")) {
            xmlFiles.push(path.join(dirname, xmlsetFileName.path));
          } else {
            xmlFiles.push(xmlsetFileName.path);
          }
        }
      });
      opcuaServerDetailsDebug("appending xmlFiles: " + xmlFiles.toString());
    }

    opcuaServerDetailsDebug("node sets:" + xmlFiles.toString());

    return xmlFiles;
  },

  defaultServerOptions: (node: NodeRedNode): ServerOptions => {
    const certificateFile =
      node.publicCertificateFile || serverCertificateFile("2048");
    const privateKeyFile = node.privateCertificateFile || serverKeyFile("2048");
    const registerServerMethod = 1;

    return {
      port:
        typeof node.port === "string" ? parseInt(node.port) : node.port || 4334,
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

      // **Explicitly define security policies and modes**
      securityPolicies: [SecurityPolicy.None, SecurityPolicy.Basic256Sha256],
      securityModes: [
        MessageSecurityMode.None,
        MessageSecurityMode.Sign,
        MessageSecurityMode.SignAndEncrypt,
      ],
    };
  },

  constructAddressSpaceFromScript: (
    server: OPCUAServer,
    constructAddressSpaceScript: Function,
    opcua: any,
    eventObjects: Record<string, any>,
    done: () => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const addressSpace = server.engine.addressSpace;
        if (!addressSpace) {
          reject(new Error("Address space not available"));
          return;
        }
        constructAddressSpaceScript(
          server,
          addressSpace,
          opcua, // Correctly pass the opcua module
          eventObjects,
          resolve
        );
      } catch (err) {
        reject(err);
      }
    });
  },

  postInitialize: (node: NodeRedNode, opcuaServer: OPCUAServer): void => {
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
        .constructAddressSpaceFromScript(
          opcuaServer,
          node.contribOPCUACompact.constructAddressSpaceScript,
          coreServerModule.opcua,
          node.contribOPCUACompact.eventObjects,
          () => {}
        )
        .then(() => {
          setNodeStatus(node, { fill: "green", shape: "dot", text: "active" });
          node.emit("server_running");
        })
        .catch((err: Error) => {
          setNodeStatus(node, { fill: "red", shape: "dot", text: err.message });
          node.emit("server_start_error");
        });
    }
  },

  run: (node: NodeRedNode, server: OPCUAServer): Promise<void> => {
    return new Promise((resolve, reject) => {
      server.start((err?: Error) => {
        if (err) {
          opcuaErrorDebug("Server failed to start:", err);
          reject(err);
        } else {
          if (server.endpoints && server.endpoints.length) {
            server.endpoints.forEach((endpoint) => {
              endpoint.endpointDescriptions().forEach((endpointDescription) => {
                opcuaServerDebug(
                  "Server endpointUrl: " +
                    endpointDescription.endpointUrl +
                    " securityMode: " +
                    endpointDescription.securityMode.toString() +
                    " securityPolicyUri: " +
                    (endpointDescription.securityPolicyUri
                      ? endpointDescription.securityPolicyUri.toString()
                      : "None Security Policy Uri")
                );
              });
            });

            const endpointUrl =
              server.endpoints[0].endpointDescriptions()[0].endpointUrl;
            opcuaServerDebug("Primary Server Endpoint URL " + endpointUrl);
          }

          server.on("newChannel", (channel) => {
            opcuaServerDebug(
              `Client connected with address = ${channel.remoteAddress} port = ${channel.remotePort}`
            );
          });

          server.on("closeChannel", (channel) => {
            opcuaServerDebug(
              `Client disconnected with address = ${channel.remoteAddress} port = ${channel.remotePort}`
            );
          });

          server.on("create_session", (session) => {
            opcuaServerDebug("############## SESSION CREATED ##############");
            if (session.clientDescription) {
              opcuaServerDetailsDebug(
                `Client application URI: ${session.clientDescription.applicationUri}`
              );
              opcuaServerDetailsDebug(
                `Client product URI: ${session.clientDescription.productUri}`
              );
              opcuaServerDetailsDebug(
                `Client application name: ${
                  session.clientDescription.applicationName
                    ? session.clientDescription.applicationName.toString()
                    : "none application name"
                }`
              );
              opcuaServerDetailsDebug(
                `Client application type: ${
                  session.clientDescription.applicationType
                    ? session.clientDescription.applicationType.toString()
                    : "none application type"
                }`
              );
            }

            opcuaServerDebug(
              `Session name: ${
                session.sessionName
                  ? session.sessionName.toString()
                  : "none session name"
              }`
            );
            opcuaServerDebug(`Session timeout: ${session.sessionTimeout}`);
            opcuaServerDebug(`Session id: ${session.getSessionId()}`);
          });

          server.on("session_closed", (session, reason) => {
            opcuaServerDebug("############## SESSION CLOSED ##############");
            opcuaServerDetailsDebug(`reason: ${reason}`);
            opcuaServerDetailsDebug(
              `Session name: ${
                session.sessionName
                  ? session.sessionName.toString()
                  : "none session name"
              }`
            );
          });

          opcuaServerDebug("Server Initialized");

          if (server.serverInfo) {
            opcuaServerDetailsDebug(
              `Server Info: ${JSON.stringify(server.serverInfo)}`
            );
          }

          resolve();
        }
      });
    });
  },

  // Set node status indicator in node-red
  listenForErrors,
  setStatusPending: (node: NodeRedNode): void =>
    setNodeStatus(node, { fill: "yellow", shape: "ring", text: "pending" }),
  setStatusInit: (node: NodeRedNode): void =>
    setNodeStatus(node, { fill: "yellow", shape: "dot", text: "init" }),
  setStatusActive: (node: NodeRedNode): void =>
    setNodeStatus(node, { fill: "green", shape: "dot", text: "active" }),
  setStatusClosed: (node: NodeRedNode): void =>
    setNodeStatus(node, { fill: "yellow", shape: "ring", text: "closed" }),
  setStatusError: (node: NodeRedNode, text: string): void =>
    setNodeStatus(node, { fill: "red", shape: "dot", text }),

  // Security functions
  isWindows,
  checkUserLogon,
  getPackagePathFromIndex,
  serverCertificateFile,
  serverKeyFile,
};

export default coreServerModule;
