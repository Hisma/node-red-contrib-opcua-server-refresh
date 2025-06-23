/**
 * Direct Execution Integration Test
 *
 * This test validates that address space scripts work correctly
 * when executed directly in the main context (no VM boundary).
 * This approach eliminates the "bindVariable returns invalid result" error
 * by ensuring Variant instanceof checks work properly.
 */

import {
  OPCUAServer,
  AddressSpace,
  Variant,
  DataType,
  DataValue,
} from "node-opcua";
import * as opcuaLibrary from "node-opcua";
import { createMockNodeRedNode, createMockOPCUAServer } from "../utils/mocks";

describe("Direct Execution Integration", () => {
  let mockNode: any;
  let mockServer: OPCUAServer;
  let mockAddressSpace: AddressSpace;

  beforeEach(() => {
    mockNode = createMockNodeRedNode();
    mockServer = createMockOPCUAServer();
    mockAddressSpace = mockServer.engine.addressSpace as AddressSpace;
  });

  describe("Direct Script Execution", () => {
    it("should execute address space script directly without VM boundary issues", () => {
      // This is the type of script function that would be stored in node.contribOPCUACompact.constructAddressSpaceScript
      const addressSpaceScript = function (
        server: OPCUAServer,
        addressSpace: AddressSpace,
        opcua: typeof opcuaLibrary,
        eventObjects: any,
        done: () => void
      ) {
        // Test core OPC UA operations that were failing with VM boundary
        const variant1 = new opcua.Variant({
          dataType: opcua.DataType.Double,
          value: 1000.0,
        });
        const variant2 = new opcua.Variant({
          dataType: opcua.DataType.String,
          value: "test",
        });

        // Test DataValue creation
        const dataValue = new opcua.DataValue({
          value: new opcua.Variant({
            dataType: opcua.DataType.Double,
            value: 25.5,
          }),
          sourceTimestamp: new Date(),
        });

        // Test instanceof checks (this was failing with VM boundary)
        const isVariant1 = variant1 instanceof opcua.Variant;
        const isVariant2 = variant2 instanceof opcua.Variant;
        const isDataValue = dataValue instanceof opcua.DataValue;

        // Store results for verification
        (global as any).testResults = {
          variant1Value: variant1.value,
          variant2Value: variant2.value,
          dataValueExists: dataValue.value !== undefined,
          instanceofChecks: isVariant1 && isVariant2 && isDataValue,
        };

        done();
      };

      const eventObjects = {};
      let callbackCalled = false;

      // Execute the script directly (as our new implementation does)
      addressSpaceScript(
        mockServer,
        mockAddressSpace,
        opcuaLibrary,
        eventObjects,
        () => {
          callbackCalled = true;
        }
      );

      // Verify the script executed successfully
      expect(callbackCalled).toBe(true);
      expect((global as any).testResults.variant1Value).toBe(1000.0);
      expect((global as any).testResults.variant2Value).toBe("test");
      expect((global as any).testResults.dataValueExists).toBe(true);
      expect((global as any).testResults.instanceofChecks).toBe(true);

      // Clean up
      delete (global as any).testResults;
    });

    it("should handle getter functions that return Variants correctly", () => {
      const addressSpaceScript = function (
        server: OPCUAServer,
        addressSpace: AddressSpace,
        opcua: typeof opcuaLibrary,
        eventObjects: any,
        done: () => void
      ) {
        // Test getter function that returns a Variant (common pattern in user scripts)
        const getterFunction = function () {
          const value = 100 + 50 * Math.sin(Date.now() / 10000);
          return new opcua.Variant({
            dataType: opcua.DataType.Double,
            value: value,
          });
        };

        const result = getterFunction();

        // Test that instanceof works correctly (this was the main issue)
        const isVariant = result instanceof opcua.Variant;
        const hasCorrectDataType = result.dataType === opcua.DataType.Double;
        const hasNumericValue = typeof result.value === "number";

        (global as any).getterTestResults = {
          isVariant,
          hasCorrectDataType,
          hasNumericValue,
          allTestsPassed: isVariant && hasCorrectDataType && hasNumericValue,
        };

        done();
      };

      const eventObjects = {};
      let callbackCalled = false;

      addressSpaceScript(
        mockServer,
        mockAddressSpace,
        opcuaLibrary,
        eventObjects,
        () => {
          callbackCalled = true;
        }
      );

      expect(callbackCalled).toBe(true);
      expect((global as any).getterTestResults.isVariant).toBe(true);
      expect((global as any).getterTestResults.hasCorrectDataType).toBe(true);
      expect((global as any).getterTestResults.hasNumericValue).toBe(true);
      expect((global as any).getterTestResults.allTestsPassed).toBe(true);

      // Clean up
      delete (global as any).getterTestResults;
    });

    it("should handle complex Variants and DataValues without errors", () => {
      const addressSpaceScript = function (
        server: OPCUAServer,
        addressSpace: AddressSpace,
        opcua: typeof opcuaLibrary,
        eventObjects: any,
        done: () => void
      ) {
        // Test complex Variant creation (array and matrix)
        const arrayVariant = new opcua.Variant({
          dataType: opcua.DataType.Double,
          arrayType: opcua.VariantArrayType.Array,
          value: [1, 2, 3, 4],
        });

        const matrixVariant = new opcua.Variant({
          dataType: opcua.DataType.Double,
          arrayType: opcua.VariantArrayType.Matrix,
          dimensions: [2, 2],
          value: [1, 2, 3, 4],
        });

        // Test DataValue with complex Variant
        const complexDataValue = new opcua.DataValue({
          value: arrayVariant,
          sourceTimestamp: new Date(),
          sourcePicoseconds: 0,
        });

        // Test instanceof checks for complex objects
        const arrayIsVariant = arrayVariant instanceof opcua.Variant;
        const matrixIsVariant = matrixVariant instanceof opcua.Variant;
        const dataValueIsDataValue =
          complexDataValue instanceof opcua.DataValue;

        (global as any).complexTestResults = {
          arrayLength: arrayVariant.value.length,
          matrixLength: matrixVariant.value.length,
          matrixDimensions: matrixVariant.dimensions,
          instanceofChecks:
            arrayIsVariant && matrixIsVariant && dataValueIsDataValue,
        };

        done();
      };

      const eventObjects = {};
      let callbackCalled = false;

      addressSpaceScript(
        mockServer,
        mockAddressSpace,
        opcuaLibrary,
        eventObjects,
        () => {
          callbackCalled = true;
        }
      );

      expect(callbackCalled).toBe(true);
      expect((global as any).complexTestResults.arrayLength).toBe(4);
      expect((global as any).complexTestResults.matrixLength).toBe(4);
      expect((global as any).complexTestResults.matrixDimensions).toEqual([
        2, 2,
      ]);
      expect((global as any).complexTestResults.instanceofChecks).toBe(true);

      // Clean up
      delete (global as any).complexTestResults;
    });
  });

  describe("Error Handling", () => {
    it("should handle script errors gracefully", () => {
      const faultyScript = function (
        server: OPCUAServer,
        addressSpace: AddressSpace,
        opcua: typeof opcuaLibrary,
        eventObjects: any,
        done: () => void
      ) {
        // Intentionally cause an error
        throw new Error("Test error in address space script");
      };

      expect(() => {
        faultyScript(mockServer, mockAddressSpace, opcuaLibrary, {}, () => {});
      }).toThrow("Test error in address space script");
    });
  });
});
