/**
 MIT License
 Copyright (c) 2018-2022 Klaus Landsdorf (http://node-red.plus/)
 Copyright (c) 2019 Sterfive (https://www.sterfive.com/)
 Updated by Richard Meyer 2024
 **/
import * as vm from "vm";
import { OPCUAServer, AddressSpace } from "node-opcua";
import {
  NodeRedNode,
  SandboxContext,
  EventObjects,
  SecureVM,
  SandboxModule,
  CoreServerModule,
  VMRunOptions,
} from "../types";

const serverSandboxModule: SandboxModule = {
  initialize: (
    node: NodeRedNode,
    coreServer: CoreServerModule,
    server: OPCUAServer,
    addressSpace: AddressSpace,
    eventObjects: EventObjects,
    done: (node: NodeRedNode, vm: SecureVM) => void
  ): void => {
    node.outstandingTimers = [];
    node.outstandingIntervals = [];

    /* istanbul ignore next */
    // Attach sandboxFlowContext directly to eventObjects
    eventObjects.sandboxFlowContext = {
      set: function (...args: any[]): void {
        const [key, value, store] = args;
        node.context().flow.set(key, value, store);
      },
      get: function (...args: any[]): any {
        const [key, store] = args;
        return node.context().flow.get(key, store);
      },
      keys: function (...args: any[]): string[] {
        const [store] = args;
        return node.context().flow.keys(store);
      },
    };

    // Create the sandbox object with proper function binding
    const sandbox: SandboxContext = {
      node,
      coreServer,
      opcua: coreServer.opcua, // Expose the opcua module
      server, // Expose the OPC UA server instance
      addressSpace, // Expose the address space
      eventObjects, // Now includes sandboxFlowContext

      sandboxNodeContext: {
        set: function (...args: any[]): void {
          const [key, value, store] = args;
          return node.context().set(key, value, store);
        },
        get: function (...args: any[]): any {
          const [key, store] = args;
          return node.context().get(key, store);
        },
        keys: function (...args: any[]): string[] {
          const [store] = args;
          return node.context().keys(store);
        },
        get global() {
          return node.context().global;
        },
        get flow() {
          return node.context().flow;
        },
      },

      sandboxGlobalContext: {
        set: function (...args: any[]): void {
          const [key, value, store] = args;
          return node.context().global.set(key, value, store);
        },
        get: function (...args: any[]): any {
          const [key, store] = args;
          return node.context().global.get(key, store);
        },
        keys: function (...args: any[]): string[] {
          const [store] = args;
          return node.context().global.keys(store);
        },
      },

      sandboxEnv: {
        get: function (envVar: string): any {
          const flow = (node as any)._flow;
          return flow ? flow.getSetting(envVar) : undefined;
        },
      },

      setTimeout: function (
        callback: Function,
        delay: number,
        ...args: any[]
      ): NodeJS.Timeout {
        const wrappedCallback = (...callbackArgs: any[]) => {
          try {
            callback(...callbackArgs);
          } catch (err) {
            node.error(err as Error, {});
          }
        };

        const timerId = setTimeout(wrappedCallback, delay, ...args);

        if (!node.outstandingTimers) {
          node.outstandingTimers = [];
        }
        node.outstandingTimers.push(timerId);
        return timerId;
      },

      clearTimeout: function (id: NodeJS.Timeout): void {
        clearTimeout(id);
        if (node.outstandingTimers) {
          const index = node.outstandingTimers.indexOf(id);
          if (index > -1) {
            node.outstandingTimers.splice(index, 1);
          }
        }
      },

      setInterval: function (
        callback: Function,
        delay: number,
        ...args: any[]
      ): NodeJS.Timeout {
        const wrappedCallback = (...callbackArgs: any[]) => {
          try {
            callback(...callbackArgs);
          } catch (err) {
            node.error(err as Error, {});
          }
        };

        const timerId = setInterval(wrappedCallback, delay, ...args);

        if (!node.outstandingIntervals) {
          node.outstandingIntervals = [];
        }
        node.outstandingIntervals.push(timerId);
        return timerId;
      },

      clearInterval: function (id: NodeJS.Timeout): void {
        clearInterval(id);
        if (node.outstandingIntervals) {
          const index = node.outstandingIntervals.indexOf(id);
          if (index > -1) {
            node.outstandingIntervals.splice(index, 1);
          }
        }
      },
    };

    // Create persistent VM context - this maintains state between script executions
    const persistentContext = vm.createContext(sandbox);

    // Freeze prototypes WITHIN the VM context for security
    vm.runInContext(
      `
      Object.freeze(Object.prototype);
      Object.freeze(Array.prototype);
      Object.freeze(Function.prototype);
    `,
      persistentContext
    );

    // Enhanced security wrapper for Node.js vm module
    const secureVM: SecureVM = {
      run: function (code: string, filename?: string): any {
        try {
          // Input validation and sanitization
          if (typeof code !== "string") {
            throw new Error("Code must be a string");
          }

          // Basic security checks
          if (code.includes("require(") && !code.includes("// allow-require")) {
            throw new Error("require() is not allowed in user scripts");
          }

          // Create and run script with timeout using the persistent context
          const script = new vm.Script(code, {
            filename: filename || "user-script.js",
            displayErrors: true,
          });

          const runOptions: VMRunOptions = {
            timeout: 5000,
            displayErrors: true,
            breakOnSigint: true,
          };

          return script.runInContext(persistentContext, runOptions);
        } catch (error) {
          // Enhanced error handling
          const err = error as Error;
          node.error(`Script execution error: ${err.message}`, {});
          throw error;
        }
      },
    };

    done(node, secureVM);
  },
};

export default serverSandboxModule;
