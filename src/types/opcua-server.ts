import {
  OPCUAServer,
  SecurityPolicy,
  MessageSecurityMode,
  AddressSpace,
} from "node-opcua";
import { NodeRedNode } from "./node-red";

export interface ServerOptions {
  port: number;
  resourcePath: string;
  buildInfo: {
    productName: string;
    buildNumber: string;
    buildDate: Date;
  };
  serverCapabilities: {
    maxSessions: number;
    maxBrowseContinuationPoints: number;
    maxHistoryContinuationPoints: number;
    operationLimits: {
      maxNodesPerRead: number;
      maxNodesPerWrite: number;
      maxNodesPerHistoryReadData: number;
      maxNodesPerBrowse: number;
    };
  };
  serverInfo: {
    productUri: string;
    applicationName: { text: string; locale: string };
    gatewayServerUri: null;
    discoveryProfileUri: null;
    discoveryUrls: string[];
  };
  alternateHostname?: string;
  maxConnectionsPerEndpoint: number;
  allowAnonymous: boolean;
  certificateFile: string;
  privateKeyFile: string;
  userManager: {
    isValidUser: () => boolean;
  };
  isAuditing: boolean;
  disableDiscovery: boolean;
  registerServerMethod: number;
  securityPolicies: SecurityPolicy[];
  securityModes: MessageSecurityMode[];
  nodeset_filename?: string[];
}

export interface CoreServerModule {
  // OPC UA Server exports
  nodeOpcuaServer: any;
  opcua: any;

  // Debug loggers
  debugLog: (message: string) => void;
  detailLog: (message: string) => void;
  errorLog: (message: string | Error) => void;

  // Configuration
  readConfigOfServerNode: (node: NodeRedNode, config: any) => NodeRedNode;

  // Server lifecycle
  initialize: (node: NodeRedNode, options: ServerOptions) => OPCUAServer;
  run: (node: NodeRedNode, server: OPCUAServer) => Promise<void>;
  stop: (node: NodeRedNode, server: OPCUAServer, done: () => void) => void;

  // Server configuration
  defaultServerOptions: (node: NodeRedNode) => ServerOptions;
  loadOPCUANodeSets: (node: NodeRedNode, dirname: string) => string[];
  getRegisterServerMethod: (id: number) => any;

  // Address space construction
  constructAddressSpaceFromScript: (
    server: OPCUAServer,
    constructAddressSpaceScript: Function,
    opcua: any,
    eventObjects: Record<string, any>,
    done: () => void
  ) => Promise<void>;

  postInitialize: (node: NodeRedNode, opcuaServer: OPCUAServer) => void;

  // Status management
  listenForErrors: (node: NodeRedNode) => void;
  setStatusPending: (node: NodeRedNode) => void;
  setStatusInit: (node: NodeRedNode) => void;
  setStatusActive: (node: NodeRedNode) => void;
  setStatusClosed: (node: NodeRedNode) => void;
  setStatusError: (node: NodeRedNode, text: string) => void;

  // Security functions
  isWindows: () => boolean;
  checkUserLogon: () => boolean;
  getPackagePathFromIndex: () => string;
  serverCertificateFile: (keybits: string) => string;
  serverKeyFile: (keybits: string) => string;
}

export interface AddressSpaceScript {
  (
    server: OPCUAServer,
    addressSpace: AddressSpace,
    opcua: any,
    eventObjects: Record<string, any>,
    done: () => void
  ): void;
}
