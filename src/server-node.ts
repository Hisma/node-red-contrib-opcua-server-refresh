/**
 MIT License
 Copyright (c) 2018-2022 Klaus Landsdorf (http://node-red.plus/)
 Updated by Richard Meyer 2024
 **/
import { OPCUAServer } from "node-opcua";
import {
  NodeRED,
  NodeRedNode,
  NodeConfig,
  CoreServerModule,
  SandboxModule,
} from "./types";
import coreServer from "./core/server";
import serverSandbox from "./core/server-sandbox";

export default function (RED: NodeRED): void {
  "use strict";

  function OPCUACompactServerRefreshNode(
    this: NodeRedNode,
    nodeConfig: NodeConfig
  ): void {
    // Create the Node-RED node
    RED.nodes.createNode(this, nodeConfig);
    this.name = nodeConfig.name;
    this.port = nodeConfig.port;

    const node: NodeRedNode = this;
    let opcuaServer: OPCUAServer | undefined;

    // Initial Logging and Status Setup
    coreServer.detailLog(`Creating node with ID: ${node.id}`);
    coreServer.listenForErrors(node);
    coreServer.setStatusInit(node);
    coreServer.readConfigOfServerNode(node, nodeConfig);

    // Delay Initialization based on configuration
    const initOPCUATimer = setTimeout(() => {
      coreServer.detailLog(
        `Initializing OPC UA Server for node ID: ${node.id}`
      );
      coreServer.setStatusPending(node);

      // Get server options from the core server
      const opcuaServerOptions = coreServer.defaultServerOptions(node);
      opcuaServerOptions.nodeset_filename = coreServer.loadOPCUANodeSets(
        node,
        __dirname
      );

      node.contribOPCUACompact = {};
      node.contribOPCUACompact.eventObjects = {}; // Initialize eventObjects
      node.contribOPCUACompact.initialized = false;

      // Assign the addressSpaceScript from nodeConfig
      if (nodeConfig.addressSpaceScript) {
        try {
          // Safely evaluate the addressSpaceScript as a function
          node.contribOPCUACompact.constructAddressSpaceScript = eval(
            `(${nodeConfig.addressSpaceScript})`
          );
          coreServer.debugLog(
            `Address space script successfully loaded for node ID: ${node.id}`
          );
        } catch (err) {
          const error = err as Error;
          node.error(`Failed to evaluate addressSpaceScript: ${error.message}`);
          coreServer.errorLog(
            `Address space script evaluation error: ${
              error.stack || error.message
            }`
          );
          coreServer.setStatusError(
            node,
            `Address space script error: ${error.message}`
          );
          return;
        }
      } else {
        node.warn(
          "No addressSpaceScript provided. The server might not construct the address space correctly."
        );
        coreServer.setStatusError(node, "No addressSpaceScript provided.");
        // Depending on requirements, you might choose to proceed or halt initialization here
      }

      // Initialize the OPC UA Server with the provided options
      opcuaServer = coreServer.initialize(node, opcuaServerOptions);

      // Start the server
      coreServer
        .run(node, opcuaServer)
        .then(() => {
          if (!opcuaServer) {
            throw new Error("OPC UA Server not initialized");
          }

          // Initialize the sandbox and run the addressSpaceScript within it
          const addressSpace = opcuaServer.engine.addressSpace;
          if (!addressSpace) {
            throw new Error("Address space not available");
          }

          serverSandbox.initialize(
            node,
            coreServer,
            opcuaServer, // Pass the OPC UA server instance
            addressSpace, // Pass the address space
            node.contribOPCUACompact?.eventObjects || {}, // Pass eventObjects
            (node: NodeRedNode, vm: any) => {
              if (!node.contribOPCUACompact) {
                node.contribOPCUACompact = {};
              }
              node.contribOPCUACompact.vm = vm;

              try {
                // Execute the addressSpaceScript within the sandbox
                // We need to pass the function code as a string to the VM
                const scriptFunction =
                  node.contribOPCUACompact.constructAddressSpaceScript;
                if (typeof scriptFunction === "function") {
                  // Convert function to string and execute in VM
                  const functionCode = `(${scriptFunction.toString()})`;
                  vm.run(`
                    const addressSpaceFunction = ${functionCode};
                    addressSpaceFunction(
                      server,
                      addressSpace,
                      opcua,
                      eventObjects,
                      () => {
                        // Address space construction completed
                        node.status({ fill: "green", shape: "dot", text: "active" });
                        node.emit("server_running");
                      }
                    );
                  `);
                } else {
                  throw new Error(
                    "Address space script is not a valid function"
                  );
                }

                node.contribOPCUACompact.initialized = true;
                node.emit("server_node_running");
                coreServer.setStatusActive(node);
              } catch (err) {
                const error = err as Error;
                node.error(
                  `Error executing addressSpaceScript: ${error.message}`
                );
                coreServer.errorLog(
                  `Address space script execution error: ${
                    error.stack || error.message
                  }`
                );
                coreServer.setStatusError(
                  node,
                  `Address space script execution error: ${error.message}`
                );
              }
            }
          );
        })
        .catch((err: Error) => {
          /* istanbul ignore next */
          node.warn(err);
          /* istanbul ignore next */
          node.emit("server_node_error", err);
          coreServer.setStatusError(node, `Server run error: ${err.message}`);
        });
    }, node.delayToInit || 0);

    // Function to clean up outstanding timers and intervals
    function cleanSandboxTimer(node: NodeRedNode, done: () => void): void {
      if (node.outstandingTimers) {
        while (node.outstandingTimers.length > 0) {
          const timer = node.outstandingTimers.pop();
          if (timer) {
            clearTimeout(timer);
          }
        }
      }
      if (node.outstandingIntervals) {
        while (node.outstandingIntervals.length > 0) {
          const interval = node.outstandingIntervals.pop();
          if (interval) {
            clearInterval(interval);
          }
        }
      }
      coreServer.detailLog(`Cleaned up timers for node ID: ${node.id}`);
      done();
    }

    // Function to gracefully close the server
    function closeServer(done: () => void): void {
      if (initOPCUATimer) {
        clearTimeout(initOPCUATimer);
      }

      if (opcuaServer) {
        coreServer.stop(node, opcuaServer, () => {
          setTimeout(() => {
            coreServer.setStatusClosed(node);
            cleanSandboxTimer(node, done);
          }, node.delayToClose || 0); // Default to 0 if delayToClose is not set
        });
      } else {
        cleanSandboxTimer(node, done);
      }
    }

    // Handle the node being closed (e.g., when Node-RED is stopped or the flow is redeployed)
    node.on("close", (done: () => void) => {
      closeServer(done);
    });
  }

  // Register the Node-RED node type
  RED.nodes.registerType(
    "opcua-compact-server-refresh",
    OPCUACompactServerRefreshNode as any
  );

  // Register the node in the Node-RED library (optional, based on your setup)
  RED.library.register("opcua");
}
