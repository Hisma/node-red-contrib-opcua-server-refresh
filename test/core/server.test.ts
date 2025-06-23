/**
 * Core Server Module Tests
 * Tests for the main OPC UA server functionality
 */

import { jest } from "@jest/globals";
import coreServer from "../../src/core/server";
import { OPCUAServer, SecurityPolicy, MessageSecurityMode } from "node-opcua";
import {
  createMockNodeRedNode,
  createTestServerOptions,
  createMockOPCUAServer,
  createMockAddressSpace,
  createMockNodeStatus,
  waitFor,
  delay,
} from "../utils/mocks";
import { NodeRedNode } from "../../src/types/node-red";
import { ServerOptions } from "../../src/types/opcua-server";

describe("Core Server Module", () => {
  let mockNode: jest.Mocked<NodeRedNode>;
  let mockServer: jest.Mocked<OPCUAServer>;
  let serverOptions: ServerOptions;

  beforeEach(() => {
    mockNode = createMockNodeRedNode();
    mockServer = createMockOPCUAServer();
    serverOptions = createTestServerOptions();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any timers
    if (mockNode.outstandingTimers) {
      mockNode.outstandingTimers.forEach((timer) => clearTimeout(timer));
      mockNode.outstandingTimers = [];
    }
    if (mockNode.outstandingIntervals) {
      mockNode.outstandingIntervals.forEach((interval) =>
        clearInterval(interval)
      );
      mockNode.outstandingIntervals = [];
    }
  });

  describe("Module Structure", () => {
    it("should export all required functions", () => {
      expect(coreServer.initialize).toBeDefined();
      expect(coreServer.run).toBeDefined();
      expect(coreServer.stop).toBeDefined();
      expect(coreServer.readConfigOfServerNode).toBeDefined();
      expect(coreServer.defaultServerOptions).toBeDefined();
      expect(coreServer.loadOPCUANodeSets).toBeDefined();
      expect(coreServer.constructAddressSpaceFromScript).toBeDefined();
      expect(coreServer.postInitialize).toBeDefined();
    });

    it("should export logging functions", () => {
      expect(coreServer.debugLog).toBeDefined();
      expect(coreServer.detailLog).toBeDefined();
      expect(coreServer.errorLog).toBeDefined();
    });

    it("should export status functions", () => {
      expect(coreServer.setStatusPending).toBeDefined();
      expect(coreServer.setStatusInit).toBeDefined();
      expect(coreServer.setStatusActive).toBeDefined();
      expect(coreServer.setStatusClosed).toBeDefined();
      expect(coreServer.setStatusError).toBeDefined();
    });

    it("should export utility functions", () => {
      expect(coreServer.isWindows).toBeDefined();
      expect(coreServer.checkUserLogon).toBeDefined();
      expect(coreServer.getPackagePathFromIndex).toBeDefined();
      expect(coreServer.serverCertificateFile).toBeDefined();
      expect(coreServer.serverKeyFile).toBeDefined();
    });
  });

  describe("Configuration Reading", () => {
    it("should read node configuration correctly", () => {
      const config = {
        port: 4840,
        endpoint: "/UA/Test",
        productUri: "test-product-uri",
        alternateHostname: "test-hostname",
        maxAllowedSessionNumber: 20,
        maxConnectionsPerEndpoint: 15,
        allowAnonymous: false,
        isAuditing: true,
        serverDiscovery: false,
        registerServerMethod: 2,
        discoveryServerEndpointUrl: "opc.tcp://discovery:4840",
        users: [{ username: "test", password: "test" }],
        xmlsetsOPCUA: [{ path: "test.xml" }],
      };

      const result = coreServer.readConfigOfServerNode(mockNode, config);

      expect(result.port).toBe(4840);
      expect(result.endpoint).toBe("/UA/Test");
      expect(result.productUri).toBe("test-product-uri");
      expect(result.alternateHostname).toBe("test-hostname");
      expect(result.maxAllowedSessionNumber).toBe(20);
      expect(result.maxConnectionsPerEndpoint).toBe(15);
      expect(result.allowAnonymous).toBe(false);
      expect(result.isAuditing).toBe(true);
      expect(result.disableDiscovery).toBe(true); // Note: inverted from serverDiscovery
      expect(result.registerServerMethod).toBe(2);
      expect(result.discoveryServerEndpointUrl).toBe(
        "opc.tcp://discovery:4840"
      );
      expect(result.opcuaUsers).toEqual([
        { username: "test", password: "test" },
      ]);
      expect(result.xmlsetsOPCUA).toEqual([{ path: "test.xml" }]);
    });

    it("should handle missing configuration values with defaults", () => {
      const config = {};
      const result = coreServer.readConfigOfServerNode(mockNode, config);

      expect(result.port).toBeUndefined();
      expect(result.endpoint).toBeUndefined();
      expect(result.allowAnonymous).toBeUndefined();
      expect(result.isAuditing).toBeUndefined();
    });
  });

  describe("Server Initialization", () => {
    it("should initialize OPC UA server with options", () => {
      const result = coreServer.initialize(mockNode, serverOptions);

      // The result should be an OPCUAServer instance
      expect(result).toBeInstanceOf(OPCUAServer);
    });

    it("should create default server options", () => {
      // Clear the endpoint to test default behavior
      mockNode.endpoint = undefined;

      const options = coreServer.defaultServerOptions(mockNode);

      expect(options.port).toBe(4334);
      expect(options.resourcePath).toBe("/UA/NodeRED/Compact");
      expect(options.allowAnonymous).toBe(true);
      expect(options.securityPolicies).toContain(SecurityPolicy.None);
      expect(options.securityPolicies).toContain(SecurityPolicy.Basic256Sha256);
      expect(options.securityModes).toContain(MessageSecurityMode.None);
      expect(options.securityModes).toContain(MessageSecurityMode.Sign);
      expect(options.securityModes).toContain(
        MessageSecurityMode.SignAndEncrypt
      );
    });

    it("should use node configuration in default options", () => {
      mockNode.port = 4841;
      mockNode.endpoint = "/UA/Custom";
      mockNode.productUri = "custom-product-uri";
      mockNode.allowAnonymous = false;
      mockNode.maxAllowedSessionNumber = 25;

      const options = coreServer.defaultServerOptions(mockNode);

      expect(options.port).toBe(4841);
      expect(options.resourcePath).toBe("/UA/Custom");
      expect(options.serverInfo?.productUri).toBe("custom-product-uri");
      expect(options.allowAnonymous).toBe(false);
      expect(options.serverCapabilities?.maxSessions).toBe(25);
    });
  });

  describe("Server Lifecycle", () => {
    it("should start server successfully", async () => {
      mockServer.start.mockImplementation(
        (callback?: (err?: Error) => void) => {
          setTimeout(() => callback && callback(), 10);
          return undefined;
        }
      );

      mockServer.endpoints = [
        {
          endpointDescriptions: () => [
            {
              endpointUrl: "opc.tcp://localhost:4334/UA/Test",
              securityMode: MessageSecurityMode.None,
              securityPolicyUri:
                "http://opcfoundation.org/UA/SecurityPolicy#None",
            },
          ],
        },
      ] as any;

      await expect(
        coreServer.run(mockNode, mockServer)
      ).resolves.toBeUndefined();
      expect(mockServer.start).toHaveBeenCalled();
    });

    it("should handle server start errors", async () => {
      const testError = new Error("Server start failed");
      mockServer.start.mockImplementation(
        (callback?: (err?: Error) => void) => {
          setTimeout(() => callback && callback(testError), 10);
          return undefined;
        }
      );

      await expect(coreServer.run(mockNode, mockServer)).rejects.toThrow(
        "Server start failed"
      );
      expect(mockServer.start).toHaveBeenCalled();
    });

    it("should stop server with timeout", (done) => {
      const shutdownTimeout = 2000;
      mockNode.serverShutdownTimeout = shutdownTimeout;

      mockServer.shutdown.mockImplementation((timeout, callback) => {
        expect(timeout).toBe(shutdownTimeout);
        setTimeout(callback, 10);
        return undefined;
      });

      coreServer.stop(mockNode, mockServer, () => {
        expect(mockServer.shutdown).toHaveBeenCalledWith(
          shutdownTimeout,
          expect.any(Function)
        );
        done();
      });
    });

    it("should use default timeout when not specified", (done) => {
      mockServer.shutdown.mockImplementation((timeout, callback) => {
        expect(timeout).toBe(1000); // Default timeout
        setTimeout(callback, 10);
        return undefined;
      });

      coreServer.stop(mockNode, mockServer, () => {
        expect(mockServer.shutdown).toHaveBeenCalledWith(
          1000,
          expect.any(Function)
        );
        done();
      });
    });
  });

  describe("Status Management", () => {
    it("should set pending status", () => {
      coreServer.setStatusPending(mockNode);
      expect(mockNode.status).toHaveBeenCalledWith({
        fill: "yellow",
        shape: "ring",
        text: "pending",
      });
    });

    it("should set init status", () => {
      coreServer.setStatusInit(mockNode);
      expect(mockNode.status).toHaveBeenCalledWith({
        fill: "yellow",
        shape: "dot",
        text: "init",
      });
    });

    it("should set active status", () => {
      coreServer.setStatusActive(mockNode);
      expect(mockNode.status).toHaveBeenCalledWith({
        fill: "green",
        shape: "dot",
        text: "active",
      });
    });

    it("should set closed status", () => {
      coreServer.setStatusClosed(mockNode);
      expect(mockNode.status).toHaveBeenCalledWith({
        fill: "yellow",
        shape: "ring",
        text: "closed",
      });
    });

    it("should set error status with custom text", () => {
      const errorText = "Connection failed";
      coreServer.setStatusError(mockNode, errorText);
      expect(mockNode.status).toHaveBeenCalledWith({
        fill: "red",
        shape: "dot",
        text: errorText,
      });
    });
  });

  describe("NodeSet Loading", () => {
    it("should load default nodesets", () => {
      const dirname = "/test/path";
      const nodesets = coreServer.loadOPCUANodeSets(mockNode, dirname);

      expect(nodesets).toBeInstanceOf(Array);
      expect(nodesets.length).toBeGreaterThan(0);
      // Should include standard and DI nodesets by default
      // Note: The actual file names may be different, let's check what we get
      expect(nodesets.some((ns) => ns.includes("Opc.Ua.NodeSet2.xml"))).toBe(
        true
      );
      expect(nodesets.some((ns) => ns.includes("Opc.Ua.Di.NodeSet2.xml"))).toBe(
        true
      );
    });

    it("should include custom nodesets from node configuration", () => {
      const dirname = "/test/path";
      mockNode.xmlsetsOPCUA = [
        { path: "public/vendor/custom1.xml" },
        { path: "/absolute/path/custom2.xml" },
      ];

      const nodesets = coreServer.loadOPCUANodeSets(mockNode, dirname);

      expect(nodesets.some((ns) => ns.includes("custom1.xml"))).toBe(true);
      expect(nodesets.some((ns) => ns.includes("custom2.xml"))).toBe(true);
    });
  });

  describe("Address Space Construction", () => {
    it("should construct address space from script", async () => {
      const mockAddressSpace = createMockAddressSpace();
      (mockServer as any).engine = { addressSpace: mockAddressSpace };

      const mockScript = jest.fn(
        (
          server: any,
          addressSpace: any,
          opcua: any,
          eventObjects: any,
          done: Function
        ) => {
          expect(server).toBe(mockServer);
          expect(addressSpace).toBe(mockAddressSpace);
          expect(opcua).toBe(coreServer.opcua);
          expect(eventObjects).toBeDefined();
          setTimeout(() => done(), 10);
        }
      );

      await expect(
        coreServer.constructAddressSpaceFromScript(
          mockServer,
          mockScript,
          coreServer.opcua,
          {},
          () => {}
        )
      ).resolves.toBeUndefined();

      expect(mockScript).toHaveBeenCalled();
    });

    it("should handle script execution errors", async () => {
      const mockAddressSpace = createMockAddressSpace();
      (mockServer as any).engine = { addressSpace: mockAddressSpace };

      const mockScript = jest.fn(() => {
        throw new Error("Script execution failed");
      });

      await expect(
        coreServer.constructAddressSpaceFromScript(
          mockServer,
          mockScript,
          coreServer.opcua,
          {},
          () => {}
        )
      ).rejects.toThrow("Script execution failed");
    });

    it("should handle missing address space", async () => {
      (mockServer as any).engine = { addressSpace: null };

      const mockScript = jest.fn();

      await expect(
        coreServer.constructAddressSpaceFromScript(
          mockServer,
          mockScript,
          coreServer.opcua,
          {},
          () => {}
        )
      ).rejects.toThrow("Address space not available");

      expect(mockScript).not.toHaveBeenCalled();
    });
  });

  describe("Post Initialization", () => {
    it("should initialize contrib object and event objects", () => {
      (mockNode as any).contribOPCUACompact = undefined;

      coreServer.postInitialize(mockNode, mockServer);

      expect((mockNode as any).contribOPCUACompact).toBeDefined();
      expect((mockNode as any).contribOPCUACompact?.eventObjects).toBeDefined();
    });

    it("should preserve existing contrib object", () => {
      const existingContrib = {
        eventObjects: { existing: "data" },
        constructAddressSpaceScript: jest.fn(),
      };
      (mockNode as any).contribOPCUACompact = existingContrib;

      coreServer.postInitialize(mockNode, mockServer);

      expect((mockNode as any).contribOPCUACompact).toBe(existingContrib);
    });
  });

  describe("Utility Functions", () => {
    it("should detect Windows platform correctly", () => {
      const originalPlatform = process.platform;

      // Test Windows detection
      Object.defineProperty(process, "platform", { value: "win32" });
      expect(coreServer.isWindows()).toBe(true);

      // Test non-Windows
      Object.defineProperty(process, "platform", { value: "linux" });
      expect(coreServer.isWindows()).toBe(false);

      // Restore original platform
      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("should validate user logon", () => {
      expect(coreServer.checkUserLogon()).toBe(true);
    });

    it("should generate certificate file paths", () => {
      const certPath = coreServer.serverCertificateFile("2048");
      const keyPath = coreServer.serverKeyFile("2048");

      expect(certPath).toContain("server_selfsigned_cert_2048.pem");
      expect(keyPath).toContain("server_key_2048.pem");
    });
  });
});
