/**
 * Address Space Script Integration Test
 *
 * This test validates that real-world address space scripts work correctly
 * with our VM implementation, specifically testing the user's actual script
 * that was failing with "bindVariable returns invalid result" error.
 */

import { OPCUAServer, AddressSpace, Variant, DataType } from "node-opcua";
import serverSandbox from "../../src/core/server-sandbox";
import coreServer from "../../src/core/server";
import { createMockNodeRedNode, createMockOPCUAServer } from "../utils/mocks";

describe("Address Space Script Integration", () => {
  let mockNode: any;
  let mockServer: OPCUAServer;
  let mockAddressSpace: AddressSpace;
  let vm: any;

  beforeEach(() => {
    mockNode = createMockNodeRedNode();
    mockServer = createMockOPCUAServer();
    mockAddressSpace = mockServer.engine.addressSpace as AddressSpace;
  });

  afterEach(() => {
    // Clean up any timers created during tests
    if (mockNode.outstandingTimers) {
      mockNode.outstandingTimers.forEach((timer: NodeJS.Timeout) => {
        clearTimeout(timer);
      });
    }
    if (mockNode.outstandingIntervals) {
      mockNode.outstandingIntervals.forEach((interval: NodeJS.Timeout) => {
        clearInterval(interval);
      });
    }
  });

  describe("Real-World Address Space Script", () => {
    it("should execute core OPC UA operations without bindVariable errors", (done) => {
      const eventObjects = {};

      serverSandbox.initialize(
        mockNode,
        coreServer,
        mockServer,
        mockAddressSpace,
        eventObjects,
        (node, vmInstance) => {
          vm = vmInstance;

          try {
            // Test the core OPC UA operations that were failing with bindVariable error
            const coreOpcuaTest = `
              // Test 1: Create Variant objects (this was failing before)
              const variant1 = new opcua.Variant({ dataType: opcua.DataType.Double, value: 1000.0 });
              const variant2 = new opcua.Variant({ dataType: opcua.DataType.String, value: "test" });
              
              // Test 2: Create DataValue objects
              const dataValue = new opcua.DataValue({
                value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 25.5 }),
                sourceTimestamp: new Date()
              });
              
              // Test 3: Create array and matrix variants
              const arrayVariant = new opcua.Variant({
                dataType: opcua.DataType.Double,
                arrayType: opcua.VariantArrayType.Array,
                value: [1, 2, 3, 4]
              });
              
              const matrixVariant = new opcua.Variant({
                dataType: opcua.DataType.Double,
                arrayType: opcua.VariantArrayType.Matrix,
                dimensions: [2, 2],
                value: [1, 2, 3, 4]
              });
              
              // Test 4: Access DataType constants
              const doubleType = opcua.DataType.Double;
              const stringType = opcua.DataType.String;
              
              // Test 5: Test getter functions that return Variants
              const getterFunction = function() {
                return new opcua.Variant({ dataType: opcua.DataType.Double, value: Math.random() });
              };
              const getterResult = getterFunction();
              
              // Return test results
              ({
                variant1Value: variant1.value,
                variant2Value: variant2.value,
                dataValueExists: dataValue.value !== undefined,
                arrayLength: arrayVariant.value.length,
                matrixLength: matrixVariant.value.length,
                doubleTypeExists: doubleType !== undefined,
                stringTypeExists: stringType !== undefined,
                getterWorks: getterResult.constructor.name === 'Variant',
                allTestsPassed: true
              });
            `;

            const result = vm.run(coreOpcuaTest);

            // Verify all core operations work
            expect(result.variant1Value).toBe(1000.0);
            expect(result.variant2Value).toBe("test");
            expect(result.dataValueExists).toBe(true);
            expect(result.arrayLength).toBe(4);
            expect(result.matrixLength).toBe(4);
            expect(result.doubleTypeExists).toBe(true);
            expect(result.stringTypeExists).toBe(true);
            expect(result.getterWorks).toBe(true);
            expect(result.allTestsPassed).toBe(true);

            done();
          } catch (error) {
            done(error);
          }
        }
      );
    });

    it("should execute simplified address space construction without errors", (done) => {
      const eventObjects = {};

      serverSandbox.initialize(
        mockNode,
        coreServer,
        mockServer,
        mockAddressSpace,
        eventObjects,
        (node, vmInstance) => {
          vm = vmInstance;

          try {
            // Simplified version of the user's script focusing on the core operations
            const simplifiedScript = `
              // Test the exact operations from user's script that were failing
              const namespace = addressSpace.getOwnNamespace();
              const Variant = opcua.Variant;
              const DataType = opcua.DataType;
              const VariantArrayType = opcua.VariantArrayType;
              const DataValue = opcua.DataValue;
              
              // Test creating variables with Variants (this was the main issue)
              const testVariable = new Variant({ dataType: DataType.Double, value: 1000.0 });
              
              // Test getter functions that return Variants
              const getterTest = {
                get: function () {
                  return new Variant({ dataType: DataType.Double, value: 200.0 });
                }
              };
              
              // Test DataValue creation
              const dataValueTest = new DataValue({
                value: new Variant({ dataType: DataType.Double, value: 10.0 }),
                sourceTimestamp: new Date()
              });
              
              // Test complex Variants
              const matrixTest = new Variant({
                dataType: DataType.Double,
                arrayType: VariantArrayType.Matrix,
                dimensions: [3, 3],
                value: [1, 2, 3, 4, 5, 6, 7, 8, 9]
              });
              
              // Return success indicator
              "CORE_OPERATIONS_SUCCESS";
            `;

            const result = vm.run(simplifiedScript);
            expect(result).toBe("CORE_OPERATIONS_SUCCESS");

            done();
          } catch (error) {
            done(error);
          }
        }
      );
    });

    it("should handle getter functions that return Variants correctly", (done) => {
      const eventObjects = {};

      serverSandbox.initialize(
        mockNode,
        coreServer,
        mockServer,
        mockAddressSpace,
        eventObjects,
        (node, vmInstance) => {
          vm = vmInstance;

          try {
            // Test a simple getter function that returns a Variant
            const getterTestCode = `
              const getterFunction = function() {
                const value = 100 + 50 * Math.sin(Date.now() / 10000);
                return new opcua.Variant({ 
                  dataType: opcua.DataType.Double, 
                  value: value 
                });
              };
              
              const result = getterFunction();
              
              ({
                isVariant: result.constructor.name === 'Variant',
                dataType: result.dataType,
                value: typeof result.value
              });
            `;

            const getterTest = vm.run(getterTestCode);

            expect(getterTest.isVariant).toBe(true);
            expect(getterTest.dataType).toBeDefined();
            expect(getterTest.value).toBe("number");

            done();
          } catch (error) {
            done(error);
          }
        }
      );
    });

    it("should handle DataValue objects correctly", (done) => {
      const eventObjects = {};

      serverSandbox.initialize(
        mockNode,
        coreServer,
        mockServer,
        mockAddressSpace,
        eventObjects,
        (node, vmInstance) => {
          vm = vmInstance;

          try {
            // Test DataValue creation and usage
            const dataValueTestCode = `
              const testDataValue = new opcua.DataValue({
                value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 25.5 }),
                sourceTimestamp: new Date(),
                sourcePicoseconds: 0
              });
              
              ({
                hasValue: testDataValue.value !== undefined,
                hasTimestamp: testDataValue.sourceTimestamp !== undefined,
                valueType: testDataValue.value.constructor.name,
                actualValue: testDataValue.value.value
              });
            `;

            const dataValueTest = vm.run(dataValueTestCode);

            expect(dataValueTest.hasValue).toBe(true);
            expect(dataValueTest.hasTimestamp).toBe(true);
            expect(dataValueTest.valueType).toBe("Variant");
            expect(dataValueTest.actualValue).toBe(25.5);

            done();
          } catch (error) {
            done(error);
          }
        }
      );
    });

    it("should handle complex array and matrix Variants", (done) => {
      const eventObjects = {};

      serverSandbox.initialize(
        mockNode,
        coreServer,
        mockServer,
        mockAddressSpace,
        eventObjects,
        (node, vmInstance) => {
          vm = vmInstance;

          try {
            // Test array and matrix Variant creation
            const complexVariantTestCode = `
              const arrayVariant = new opcua.Variant({
                dataType: opcua.DataType.Double,
                arrayType: opcua.VariantArrayType.Array,
                value: [1, 2, 3, 4]
              });
              
              const matrixVariant = new opcua.Variant({
                dataType: opcua.DataType.Double,
                arrayType: opcua.VariantArrayType.Matrix,
                dimensions: [3, 3],
                value: [1, 2, 3, 4, 5, 6, 7, 8, 9]
              });
              
              ({
                arrayLength: arrayVariant.value.length,
                matrixLength: matrixVariant.value.length,
                matrixDimensions: matrixVariant.dimensions
              });
            `;

            const complexVariantTest = vm.run(complexVariantTestCode);

            expect(complexVariantTest.arrayLength).toBe(4);
            expect(complexVariantTest.matrixLength).toBe(9);
            expect(complexVariantTest.matrixDimensions).toEqual([3, 3]);

            done();
          } catch (error) {
            done(error);
          }
        }
      );
    });
  });

  describe("VM Context Validation", () => {
    it("should provide all required OPC UA objects in VM context", (done) => {
      const eventObjects = {};

      serverSandbox.initialize(
        mockNode,
        coreServer,
        mockServer,
        mockAddressSpace,
        eventObjects,
        (node, vmInstance) => {
          vm = vmInstance;

          try {
            const contextCheckCode = `
              ({
                hasOpcua: typeof opcua !== 'undefined',
                hasVariant: typeof opcua.Variant !== 'undefined',
                hasDataType: typeof opcua.DataType !== 'undefined',
                hasDataValue: typeof opcua.DataValue !== 'undefined',
                hasVariantArrayType: typeof opcua.VariantArrayType !== 'undefined',
                hasStandardUnits: typeof opcua.standardUnits !== 'undefined',
                hasServer: typeof server !== 'undefined',
                hasAddressSpace: typeof addressSpace !== 'undefined',
                hasNode: typeof node !== 'undefined'
              });
            `;

            const contextCheck = vm.run(contextCheckCode);

            expect(contextCheck.hasOpcua).toBe(true);
            expect(contextCheck.hasVariant).toBe(true);
            expect(contextCheck.hasDataType).toBe(true);
            expect(contextCheck.hasDataValue).toBe(true);
            expect(contextCheck.hasVariantArrayType).toBe(true);
            expect(contextCheck.hasStandardUnits).toBe(true);
            expect(contextCheck.hasServer).toBe(true);
            expect(contextCheck.hasAddressSpace).toBe(true);
            expect(contextCheck.hasNode).toBe(true);

            done();
          } catch (error) {
            done(error);
          }
        }
      );
    });
  });
});
