/**
 * Server Sandbox Module Tests
 * Tests for the VM security and execution functionality
 */

import { jest } from "@jest/globals";
import serverSandboxModule from "../../src/core/server-sandbox";
import { OPCUAServer, AddressSpace } from "node-opcua";
import {
  createMockNodeRedNode,
  createMockOPCUAServer,
  createMockAddressSpace,
  delay,
} from "../utils/mocks";
import { NodeRedNode, EventObjects, SecureVM } from "../../src/types";
import coreServer from "../../src/core/server";

describe("Server Sandbox Module", () => {
  let mockNode: jest.Mocked<NodeRedNode>;
  let mockServer: jest.Mocked<OPCUAServer>;
  let mockAddressSpace: jest.Mocked<AddressSpace>;
  let eventObjects: EventObjects;
  let secureVM: SecureVM;

  beforeEach(() => {
    mockNode = createMockNodeRedNode();
    mockServer = createMockOPCUAServer();
    mockAddressSpace = createMockAddressSpace();
    eventObjects = {};

    // Reset all mocks
    jest.clearAllMocks();

    // Initialize the sandbox
    serverSandboxModule.initialize(
      mockNode,
      coreServer,
      mockServer,
      mockAddressSpace,
      eventObjects,
      (node: NodeRedNode, vm: SecureVM) => {
        secureVM = vm;
      }
    );
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
    it("should export initialize function", () => {
      expect(serverSandboxModule.initialize).toBeDefined();
      expect(typeof serverSandboxModule.initialize).toBe("function");
    });
  });

  describe("Sandbox Initialization", () => {
    it("should initialize timer arrays", () => {
      expect(mockNode.outstandingTimers).toEqual([]);
      expect(mockNode.outstandingIntervals).toEqual([]);
    });

    it("should create secure VM instance", () => {
      expect(secureVM).toBeDefined();
      expect(secureVM.run).toBeDefined();
      expect(typeof secureVM.run).toBe("function");
    });

    it("should attach sandboxFlowContext to eventObjects", () => {
      expect(eventObjects.sandboxFlowContext).toBeDefined();
      expect(eventObjects.sandboxFlowContext?.set).toBeDefined();
      expect(eventObjects.sandboxFlowContext?.get).toBeDefined();
      expect(eventObjects.sandboxFlowContext?.keys).toBeDefined();
    });
  });

  describe("Secure VM Execution", () => {
    it("should execute simple JavaScript code", () => {
      const result = secureVM.run("1 + 1");
      expect(result).toBe(2);
    });

    it("should execute code with variables", () => {
      const result = secureVM.run("const x = 5; const y = 10; x + y");
      expect(result).toBe(15);
    });

    it("should have access to sandbox context", () => {
      const result = secureVM.run("typeof node");
      expect(result).toBe("object");
    });

    it("should have access to opcua module", () => {
      const result = secureVM.run("typeof opcua");
      expect(result).toBe("object");
    });

    it("should have access to server instance", () => {
      const result = secureVM.run("typeof server");
      expect(result).toBe("object");
    });

    it("should have access to address space", () => {
      const result = secureVM.run("typeof addressSpace");
      expect(result).toBe("object");
    });

    it("should have access to event objects", () => {
      const result = secureVM.run("typeof eventObjects");
      expect(result).toBe("object");
    });
  });

  describe("Security Features", () => {
    it("should block require() calls by default", () => {
      expect(() => {
        secureVM.run('require("fs")');
      }).toThrow("require() is not allowed in user scripts");
    });

    it("should allow require() with special comment", () => {
      // This should not throw since we have the allow comment
      expect(() => {
        secureVM.run('// allow-require\nrequire("path")');
      }).not.toThrow("require() is not allowed in user scripts");
    });

    it("should validate input is a string", () => {
      expect(() => {
        secureVM.run(123 as any);
      }).toThrow("Code must be a string");
    });

    it("should enforce execution timeout", async () => {
      const startTime = Date.now();

      expect(() => {
        secureVM.run("while(true) {}"); // Infinite loop
      }).toThrow();

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(6000); // Should timeout before 6 seconds
    }, 10000);

    it("should handle syntax errors gracefully", () => {
      expect(() => {
        secureVM.run("invalid javascript syntax {{{");
      }).toThrow();

      expect(mockNode.error).toHaveBeenCalled();
    });

    it("should handle runtime errors gracefully", () => {
      expect(() => {
        secureVM.run('throw new Error("Test error")');
      }).toThrow("Test error");

      expect(mockNode.error).toHaveBeenCalled();
    });
  });

  describe("Context Access", () => {
    it("should provide node context access", () => {
      // Get the context before running the VM code
      const mockContext = mockNode.context();

      // Execute the context operations
      secureVM.run('sandboxNodeContext.set("testKey", "testValue")');
      secureVM.run('sandboxNodeContext.get("testKey")');
      secureVM.run("sandboxNodeContext.keys()");

      // Verify the calls were made
      expect(mockContext.set).toHaveBeenCalledWith(
        "testKey",
        "testValue",
        undefined
      );
      expect(mockContext.get).toHaveBeenCalledWith("testKey", undefined);
      expect(mockContext.keys).toHaveBeenCalledWith(undefined);
    });

    it("should provide flow context access through eventObjects", () => {
      // Get the flow context before running the VM code
      const mockFlowContext = mockNode.context().flow;

      // Execute the flow context operations
      secureVM.run(
        'eventObjects.sandboxFlowContext.set("flowKey", "flowValue")'
      );
      secureVM.run('eventObjects.sandboxFlowContext.get("flowKey")');
      secureVM.run("eventObjects.sandboxFlowContext.keys()");

      // Verify the calls were made
      expect(mockFlowContext.set).toHaveBeenCalledWith(
        "flowKey",
        "flowValue",
        undefined
      );
      expect(mockFlowContext.get).toHaveBeenCalledWith("flowKey", undefined);
      expect(mockFlowContext.keys).toHaveBeenCalledWith(undefined);
    });

    it("should provide global context access", () => {
      // Get the global context before running the VM code
      const mockGlobalContext = mockNode.context().global;

      // Execute the global context operations
      secureVM.run('sandboxGlobalContext.set("globalKey", "globalValue")');
      secureVM.run('sandboxGlobalContext.get("globalKey")');
      secureVM.run("sandboxGlobalContext.keys()");

      // Verify the calls were made
      expect(mockGlobalContext.set).toHaveBeenCalledWith(
        "globalKey",
        "globalValue",
        undefined
      );
      expect(mockGlobalContext.get).toHaveBeenCalledWith(
        "globalKey",
        undefined
      );
      expect(mockGlobalContext.keys).toHaveBeenCalledWith(undefined);
    });

    it("should provide environment variable access", () => {
      // Mock the flow getSetting method
      const mockFlow = { getSetting: jest.fn().mockReturnValue("test-value") };
      (mockNode as any)._flow = mockFlow;

      const result = secureVM.run('sandboxEnv.get("TEST_VAR")');
      expect(mockFlow.getSetting).toHaveBeenCalledWith("TEST_VAR");
    });
  });

  describe("Timer Management", () => {
    it("should track setTimeout calls", () => {
      const initialTimerCount = mockNode.outstandingTimers?.length || 0;

      secureVM.run("setTimeout(() => {}, 100)");

      expect(mockNode.outstandingTimers?.length).toBe(initialTimerCount + 1);
    });

    it("should track setInterval calls", () => {
      const initialIntervalCount = mockNode.outstandingIntervals?.length || 0;

      secureVM.run("setInterval(() => {}, 100)");

      expect(mockNode.outstandingIntervals?.length).toBe(
        initialIntervalCount + 1
      );
    });

    it("should handle clearTimeout", () => {
      // Create a timer and get its ID
      secureVM.run("var timerId = setTimeout(() => {}, 100)");
      const initialCount = mockNode.outstandingTimers?.length || 0;

      // Clear the timer using the stored ID
      secureVM.run("clearTimeout(timerId)");

      expect(mockNode.outstandingTimers?.length).toBeLessThan(initialCount);
    });

    it("should handle clearInterval", () => {
      // Create an interval and get its ID
      secureVM.run("var intervalId = setInterval(() => {}, 100)");
      const initialCount = mockNode.outstandingIntervals?.length || 0;

      // Clear the interval using the stored ID
      secureVM.run("clearInterval(intervalId)");

      expect(mockNode.outstandingIntervals?.length).toBeLessThan(initialCount);
    });

    it("should wrap timer callbacks for error handling", async () => {
      let callbackExecuted = false;

      // Execute a timer that throws an error
      secureVM.run(`
        setTimeout(() => {
          throw new Error("Timer callback error");
        }, 10)
      `);

      // Wait for the timer to execute
      await delay(50);

      // The error should be caught and passed to node.error
      expect(mockNode.error).toHaveBeenCalled();
    });

    it("should wrap interval callbacks for error handling", async () => {
      // Execute an interval that throws an error
      const intervalId = secureVM.run(`
        setInterval(() => {
          throw new Error("Interval callback error");
        }, 10)
      `);

      // Wait for the interval to execute at least once
      await delay(50);

      // Clean up the interval
      clearInterval(intervalId);

      // The error should be caught and passed to node.error
      expect(mockNode.error).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing filename parameter", () => {
      expect(() => {
        secureVM.run("1 + 1"); // No filename provided
      }).not.toThrow();
    });

    it("should use default filename when not provided", () => {
      // This should work without throwing
      const result = secureVM.run("2 + 2");
      expect(result).toBe(4);
    });

    it("should handle custom filename", () => {
      const result = secureVM.run("3 + 3", "custom-script.js");
      expect(result).toBe(6);
    });
  });

  describe("Prototype Protection", () => {
    it("should prevent prototype pollution attempts", () => {
      // These operations should not affect the global prototypes
      expect(() => {
        secureVM.run(`
          Object.prototype.polluted = true;
          Array.prototype.polluted = true;
          Function.prototype.polluted = true;
        `);
      }).not.toThrow();

      // Verify prototypes are not actually polluted outside the sandbox
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Array.prototype as any).polluted).toBeUndefined();
      expect((Function.prototype as any).polluted).toBeUndefined();
    });
  });

  describe("Complex Script Execution", () => {
    it("should execute complex address space construction script", () => {
      const script = `
        // Create a namespace
        const namespace = addressSpace.getOwnNamespace();
        
        // Add a variable to the address space
        const variable = namespace.addVariable({
          componentOf: addressSpace.rootFolder.objects,
          browseName: "TestVariable",
          dataType: "Double",
          value: {
            get: function() {
              return new opcua.Variant({
                dataType: opcua.DataType.Double,
                value: 42.0
              });
            }
          }
        });
        
        // Store reference in event objects
        eventObjects.testVariable = variable;
        
        "Script executed successfully"
      `;

      const result = secureVM.run(script);
      expect(result).toBe("Script executed successfully");
    });

    it("should handle asynchronous operations in scripts", async () => {
      const script = `
        let result = "initial";
        
        setTimeout(() => {
          result = "updated";
          eventObjects.asyncResult = result;
        }, 10);
        
        result
      `;

      const initialResult = secureVM.run(script);
      expect(initialResult).toBe("initial");

      // Wait for the async operation
      await delay(50);

      // Check if the async operation updated the event objects
      expect(eventObjects.asyncResult).toBe("updated");
    });
  });
});
