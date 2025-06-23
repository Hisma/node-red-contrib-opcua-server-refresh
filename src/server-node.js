"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./core/server"));
const server_sandbox_1 = __importDefault(require("./core/server-sandbox"));
function default_1(RED) {
    "use strict";
    function OPCUACompactServerRefreshNode(nodeConfig) {
        RED.nodes.createNode(this, nodeConfig);
        this.name = nodeConfig.name;
        this.port = nodeConfig.port;
        const node = this;
        let opcuaServer;
        server_1.default.detailLog(`Creating node with ID: ${node.id}`);
        server_1.default.listenForErrors(node);
        server_1.default.setStatusInit(node);
        server_1.default.readConfigOfServerNode(node, nodeConfig);
        const initOPCUATimer = setTimeout(() => {
            server_1.default.detailLog(`Initializing OPC UA Server for node ID: ${node.id}`);
            server_1.default.setStatusPending(node);
            const opcuaServerOptions = server_1.default.defaultServerOptions(node);
            opcuaServerOptions.nodeset_filename = server_1.default.loadOPCUANodeSets(node, __dirname);
            node.contribOPCUACompact = {};
            node.contribOPCUACompact.eventObjects = {};
            node.contribOPCUACompact.initialized = false;
            if (nodeConfig.addressSpaceScript) {
                try {
                    node.contribOPCUACompact.constructAddressSpaceScript = eval(`(${nodeConfig.addressSpaceScript})`);
                    server_1.default.debugLog(`Address space script successfully loaded for node ID: ${node.id}`);
                }
                catch (err) {
                    const error = err;
                    node.error(`Failed to evaluate addressSpaceScript: ${error.message}`);
                    server_1.default.errorLog(`Address space script evaluation error: ${error.stack || error.message}`);
                    server_1.default.setStatusError(node, `Address space script error: ${error.message}`);
                    return;
                }
            }
            else {
                node.warn("No addressSpaceScript provided. The server might not construct the address space correctly.");
                server_1.default.setStatusError(node, "No addressSpaceScript provided.");
            }
            opcuaServer = server_1.default.initialize(node, opcuaServerOptions);
            server_1.default
                .run(node, opcuaServer)
                .then(() => {
                if (!opcuaServer) {
                    throw new Error("OPC UA Server not initialized");
                }
                const addressSpace = opcuaServer.engine.addressSpace;
                if (!addressSpace) {
                    throw new Error("Address space not available");
                }
                server_sandbox_1.default.initialize(node, server_1.default, opcuaServer, addressSpace, node.contribOPCUACompact?.eventObjects || {}, (node, vm) => {
                    if (!node.contribOPCUACompact) {
                        node.contribOPCUACompact = {};
                    }
                    node.contribOPCUACompact.vm = vm;
                    try {
                        vm.run(`
                  node.contribOPCUACompact.constructAddressSpaceScript = node.contribOPCUACompact.constructAddressSpaceScript;
                `);
                        vm.run(`
                  node.contribOPCUACompact.constructAddressSpaceScript(
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
                        node.contribOPCUACompact.initialized = true;
                        node.emit("server_node_running");
                        server_1.default.setStatusActive(node);
                    }
                    catch (err) {
                        const error = err;
                        node.error(`Error executing addressSpaceScript: ${error.message}`);
                        server_1.default.errorLog(`Address space script execution error: ${error.stack || error.message}`);
                        server_1.default.setStatusError(node, `Address space script execution error: ${error.message}`);
                    }
                });
            })
                .catch((err) => {
                node.warn(err);
                node.emit("server_node_error", err);
                server_1.default.setStatusError(node, `Server run error: ${err.message}`);
            });
        }, node.delayToInit || 0);
        function cleanSandboxTimer(node, done) {
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
            server_1.default.detailLog(`Cleaned up timers for node ID: ${node.id}`);
            done();
        }
        function closeServer(done) {
            if (initOPCUATimer) {
                clearTimeout(initOPCUATimer);
            }
            if (opcuaServer) {
                server_1.default.stop(node, opcuaServer, () => {
                    setTimeout(() => {
                        server_1.default.setStatusClosed(node);
                        cleanSandboxTimer(node, done);
                    }, node.delayToClose || 0);
                });
            }
            else {
                cleanSandboxTimer(node, done);
            }
        }
        node.on("close", (done) => {
            closeServer(done);
        });
    }
    RED.nodes.registerType("opcua-compact-server-refresh", OPCUACompactServerRefreshNode);
    RED.library.register("opcua");
}
exports.default = default_1;
;
