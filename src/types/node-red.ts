import { EventEmitter } from "events";

export interface NodeRedNode extends EventEmitter {
  id: string;
  name: string;
  type: string;
  z: string;
  _flow?: any;

  // Status methods
  status(options: NodeStatus): void;

  // Logging methods
  log(message: string): void;
  warn(message: string | Error): void;
  error(message: string | Error, msg?: any): void;
  debug(message: string): void;
  trace(message: string): void;

  // Context methods
  context(): NodeContext;

  // Timer tracking for cleanup
  outstandingTimers?: NodeJS.Timeout[];
  outstandingIntervals?: NodeJS.Timeout[];

  // OPC UA Server specific properties
  port?: number | string;
  endpoint?: string;
  productUri?: string;
  alternateHostname?: string;

  // Limits
  maxAllowedSessionNumber?: number;
  maxConnectionsPerEndpoint?: number;
  maxAllowedSubscriptionNumber?: number;
  maxNodesPerRead?: number;
  maxNodesPerWrite?: number;
  maxNodesPerHistoryReadData?: number;
  maxNodesPerBrowse?: number;
  maxBrowseContinuationPoints?: number;
  maxHistoryContinuationPoints?: number;

  // Timing
  delayToInit?: number;
  delayToClose?: number;
  serverShutdownTimeout?: number;

  // Display options
  showStatusActivities?: boolean;
  showErrors?: boolean;

  // Security
  publicCertificateFile?: string;
  privateCertificateFile?: string;
  allowAnonymous?: boolean;
  opcuaUsers?: any[];

  // XML Sets
  xmlsetsOPCUA?: Array<{ path: string }>;

  // Audit
  isAuditing?: boolean;

  // Discovery
  disableDiscovery?: boolean;
  registerServerMethod?: number;
  discoveryServerEndpointUrl?: string;
  capabilitiesForMDNS?: string[];

  // Plugin-specific properties
  contribOPCUACompact?: {
    eventObjects?: Record<string, any>;
    initialized?: boolean;
    constructAddressSpaceScript?: Function;
    vm?: any;
  };
}

export interface NodeStatus {
  fill: "red" | "green" | "yellow" | "blue" | "grey";
  shape: "ring" | "dot";
  text: string;
}

export interface NodeContext {
  set(key: string, value: any, store?: string): void;
  get(key: string, store?: string): any;
  keys(store?: string): string[];
  flow: FlowContext;
  global: GlobalContext;
}

export interface FlowContext {
  set(key: string, value: any, store?: string): void;
  get(key: string, store?: string): any;
  keys(store?: string): string[];
}

export interface GlobalContext {
  set(key: string, value: any, store?: string): void;
  get(key: string, store?: string): any;
  keys(store?: string): string[];
}

export interface NodeConfig {
  id: string;
  type: string;
  name: string;
  port: number | string;
  endpoint?: string;
  productUri?: string;
  alternateHostname?: string;

  // Limits
  maxAllowedSessionNumber?: number;
  maxConnectionsPerEndpoint?: number;
  maxAllowedSubscriptionNumber?: number;
  maxNodesPerRead?: number;
  maxNodesPerWrite?: number;
  maxNodesPerHistoryReadData?: number;
  maxNodesPerBrowse?: number;
  maxBrowseContinuationPoints?: number;
  maxHistoryContinuationPoints?: number;

  // Timing
  delayToInit?: number;
  delayToClose?: number;
  serverShutdownTimeout?: number;

  // Display
  showStatusActivities?: boolean;
  showErrors?: boolean;

  // Security
  publicCertificateFile?: string;
  privateCertificateFile?: string;
  allowAnonymous?: boolean;
  users?: any[];

  // XML Sets
  xmlsetsOPCUA?: Array<{ path: string }>;

  // Audit
  isAuditing?: boolean;

  // Discovery
  serverDiscovery?: boolean;
  registerServerMethod?: number;
  discoveryServerEndpointUrl?: string;
  capabilitiesForMDNS?: string;

  // Address Space Script
  addressSpaceScript?: string;
}

export interface NodeRED {
  nodes: {
    createNode(node: any, config: NodeConfig): void;
    registerType(type: string, constructor: any): void;
  };
  library: {
    register(name: string): void;
  };
}
