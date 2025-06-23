/**
 * Mock factories for TypeScript tests
 * Provides type-safe mocks for all major interfaces
 */

import { jest } from "@jest/globals";
import { NodeRedNode, NodeStatus } from "../../src/types/node-red";
import { ServerOptions } from "../../src/types/opcua-server";
import {
  OPCUAServer,
  AddressSpace,
  SecurityPolicy,
  MessageSecurityMode,
} from "node-opcua";

/**
 * Creates a mock Node-RED node with all required properties
 */
export function createMockNodeRedNode(): jest.Mocked<NodeRedNode> {
  const mockNode = {
    // Basic node properties
    id: "test-node-id",
    type: "opcua-compact-server",
    name: "Test OPC UA Server",
    z: "test-flow-id",

    // Network configuration
    port: 4334,
    endpoint: "/UA/NodeRED/Test",
    productUri: "NodeOPCUA-Test-Server",
    alternateHostname: undefined,

    // Limits
    maxAllowedSessionNumber: 10,
    maxConnectionsPerEndpoint: 10,
    maxAllowedSubscriptionNumber: 50,
    maxNodesPerRead: 1000,
    maxNodesPerWrite: 1000,
    maxNodesPerHistoryReadData: 100,
    maxNodesPerBrowse: 1000,
    maxBrowseContinuationPoints: 10,
    maxHistoryContinuationPoints: 10,

    // Timing
    delayToInit: 1000,
    delayToClose: 1000,
    serverShutdownTimeout: 1000,

    // Display options
    showStatusActivities: true,
    showErrors: true,

    // Security
    allowAnonymous: true,
    publicCertificateFile: undefined,
    privateCertificateFile: undefined,
    opcuaUsers: [],

    // XML nodesets
    xmlsetsOPCUA: [],

    // Audit
    isAuditing: false,

    // Discovery
    disableDiscovery: false,
    registerServerMethod: 1,
    discoveryServerEndpointUrl: undefined,
    capabilitiesForMDNS: [],

    // Runtime properties
    outstandingTimers: [],
    outstandingIntervals: [],
    contribOPCUACompact: {
      eventObjects: {},
      constructAddressSpaceScript: undefined,
    },

    // Node-RED methods
    status: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
    off: jest.fn(),
    setMaxListeners: jest.fn(),
    getMaxListeners: jest.fn(),
    listeners: jest.fn(),
    rawListeners: jest.fn(),
    listenerCount: jest.fn(),
    prependListener: jest.fn(),
    prependOnceListener: jest.fn(),
    eventNames: jest.fn(),

    // Context methods - create a persistent context object
    context: (() => {
      const mockContext = {
        set: jest.fn(),
        get: jest.fn(),
        keys: jest.fn(),
        flow: {
          set: jest.fn(),
          get: jest.fn(),
          keys: jest.fn(),
        },
        global: {
          set: jest.fn(),
          get: jest.fn(),
          keys: jest.fn(),
        },
      };
      return jest.fn(() => mockContext);
    })(),

    // Send method
    send: jest.fn(),

    // Close method
    close: jest.fn(),
  } as unknown as jest.Mocked<NodeRedNode>;

  return mockNode;
}

/**
 * Creates default server options for testing
 */
export function createTestServerOptions(
  overrides: Partial<ServerOptions> = {}
): ServerOptions {
  const defaultOptions: ServerOptions = {
    port: 4334,
    resourcePath: "/UA/NodeRED/Test",
    buildInfo: {
      productName: "Test OPC UA Server",
      buildNumber: "1.0.0",
      buildDate: new Date("2024-01-01"),
    },
    serverCapabilities: {
      maxSessions: 10,
      maxBrowseContinuationPoints: 10,
      maxHistoryContinuationPoints: 10,
      operationLimits: {
        maxNodesPerRead: 1000,
        maxNodesPerWrite: 1000,
        maxNodesPerHistoryReadData: 100,
        maxNodesPerBrowse: 1000,
      },
    },
    serverInfo: {
      productUri: "NodeOPCUA-Test-Server",
      applicationName: { text: "Test Server", locale: "en" },
      gatewayServerUri: null,
      discoveryProfileUri: null,
      discoveryUrls: [],
    },
    maxConnectionsPerEndpoint: 10,
    allowAnonymous: true,
    certificateFile: "test-cert.pem",
    privateKeyFile: "test-key.pem",
    userManager: {
      isValidUser: () => true,
    },
    isAuditing: false,
    disableDiscovery: true,
    registerServerMethod: 1,
    securityPolicies: [SecurityPolicy.None],
    securityModes: [MessageSecurityMode.None],
  };

  return { ...defaultOptions, ...overrides };
}

/**
 * Creates a mock OPC UA server
 */
export function createMockOPCUAServer(): jest.Mocked<OPCUAServer> {
  const mockServer = {
    start: jest.fn(),
    shutdown: jest.fn(),
    getCurrentState: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    engine: {
      addressSpace: createMockAddressSpace(),
    },
    endpoints: [],
    serverInfo: {
      productUri: "test-server",
      applicationName: { text: "Test", locale: "en" },
      gatewayServerUri: null,
      discoveryProfileUri: null,
      discoveryUrls: [],
    },
  } as unknown as jest.Mocked<OPCUAServer>;

  return mockServer;
}

/**
 * Creates a mock address space
 */
export function createMockAddressSpace(): jest.Mocked<AddressSpace> {
  const mockNamespace = {
    addVariable: jest.fn().mockReturnValue({
      nodeId: "test-variable-id",
      setValueFromSource: jest.fn(),
    }),
    addObject: jest.fn().mockReturnValue({ nodeId: "test-object-id" }),
    addMethod: jest.fn().mockReturnValue({ nodeId: "test-method-id" }),
    addFolder: jest.fn().mockReturnValue({ nodeId: "test-folder-id" }),
    addAnalogDataItem: jest.fn().mockReturnValue({ nodeId: "test-analog-id" }),
    addView: jest.fn().mockReturnValue({
      nodeId: "test-view-id",
      addReference: jest.fn(),
    }),
  };

  const mockRootFolder = {
    nodeId: "RootFolder",
    objects: { nodeId: "objects-folder" },
    views: { nodeId: "views-folder" },
  };

  const mockAddressSpace = {
    getOwnNamespace: jest.fn().mockReturnValue(mockNamespace),
    getNamespace: jest.fn().mockReturnValue(mockNamespace),
    registerNamespace: jest.fn(),
    addVariable: jest.fn(),
    addObject: jest.fn(),
    addMethod: jest.fn(),
    findNode: jest.fn().mockImplementation((nodeId: unknown) => {
      if (nodeId === "RootFolder") {
        return mockRootFolder;
      }
      return { nodeId };
    }),
    rootFolder: mockRootFolder,
    dispose: jest.fn(),
  } as unknown as jest.Mocked<AddressSpace>;

  return mockAddressSpace;
}

/**
 * Creates a mock Node status
 */
export function createMockNodeStatus(
  fill: "red" | "green" | "yellow" | "blue" | "grey" = "green",
  shape: "ring" | "dot" = "dot",
  text: string = "ready"
): NodeStatus {
  return { fill, shape, text };
}

/**
 * Helper to create test certificates paths
 */
export function getTestCertificatePaths() {
  return {
    certificateFile: "/test/certificates/test_cert.pem",
    privateKeyFile: "/test/certificates/test_key.pem",
  };
}

/**
 * Helper to create test script for address space construction
 */
export function createTestAddressSpaceScript() {
  return function (
    server: any,
    addressSpace: any,
    opcua: any,
    eventObjects: any,
    done: Function
  ) {
    // Simple test script that just calls done
    setTimeout(done, 10);
  };
}

/**
 * Async helper to wait for a condition
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Helper to create a promise that resolves after a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
