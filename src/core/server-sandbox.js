"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vm = __importStar(require("vm"));
const serverSandboxModule = {
    initialize: (node, coreServer, server, addressSpace, eventObjects, done) => {
        node.outstandingTimers = [];
        node.outstandingIntervals = [];
        eventObjects.sandboxFlowContext = {
            set: function (...args) {
                const [key, value, store] = args;
                node.context().flow.set(key, value, store);
            },
            get: function (...args) {
                const [key, store] = args;
                return node.context().flow.get(key, store);
            },
            keys: function (...args) {
                const [store] = args;
                return node.context().flow.keys(store);
            },
        };
        const sandbox = {
            node,
            coreServer,
            opcua: coreServer.opcua,
            server,
            addressSpace,
            eventObjects,
            sandboxNodeContext: {
                set: function (...args) {
                    const [key, value, store] = args;
                    return node.context().set(key, value, store);
                },
                get: function (...args) {
                    const [key, store] = args;
                    return node.context().get(key, store);
                },
                keys: function (...args) {
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
                set: function (...args) {
                    const [key, value, store] = args;
                    return node.context().global.set(key, value, store);
                },
                get: function (...args) {
                    const [key, store] = args;
                    return node.context().global.get(key, store);
                },
                keys: function (...args) {
                    const [store] = args;
                    return node.context().global.keys(store);
                },
            },
            sandboxEnv: {
                get: function (envVar) {
                    const flow = node._flow;
                    return flow ? flow.getSetting(envVar) : undefined;
                },
            },
            setTimeout: function (callback, delay, ...args) {
                const wrappedCallback = (...callbackArgs) => {
                    try {
                        callback(...callbackArgs);
                    }
                    catch (err) {
                        node.error(err, {});
                    }
                };
                const timerId = setTimeout(wrappedCallback, delay, ...args);
                if (!node.outstandingTimers) {
                    node.outstandingTimers = [];
                }
                node.outstandingTimers.push(timerId);
                return timerId;
            },
            clearTimeout: function (id) {
                clearTimeout(id);
                if (node.outstandingTimers) {
                    const index = node.outstandingTimers.indexOf(id);
                    if (index > -1) {
                        node.outstandingTimers.splice(index, 1);
                    }
                }
            },
            setInterval: function (callback, delay, ...args) {
                const wrappedCallback = (...callbackArgs) => {
                    try {
                        callback(...callbackArgs);
                    }
                    catch (err) {
                        node.error(err, {});
                    }
                };
                const timerId = setInterval(wrappedCallback, delay, ...args);
                if (!node.outstandingIntervals) {
                    node.outstandingIntervals = [];
                }
                node.outstandingIntervals.push(timerId);
                return timerId;
            },
            clearInterval: function (id) {
                clearInterval(id);
                if (node.outstandingIntervals) {
                    const index = node.outstandingIntervals.indexOf(id);
                    if (index > -1) {
                        node.outstandingIntervals.splice(index, 1);
                    }
                }
            },
        };
        const persistentContext = vm.createContext(sandbox);
        vm.runInContext(`
      Object.freeze(Object.prototype);
      Object.freeze(Array.prototype);
      Object.freeze(Function.prototype);
    `, persistentContext);
        const secureVM = {
            run: function (code, filename) {
                try {
                    if (typeof code !== "string") {
                        throw new Error("Code must be a string");
                    }
                    if (code.includes("require(") && !code.includes("// allow-require")) {
                        throw new Error("require() is not allowed in user scripts");
                    }
                    const script = new vm.Script(code, {
                        filename: filename || "user-script.js",
                        displayErrors: true,
                    });
                    const runOptions = {
                        timeout: 5000,
                        displayErrors: true,
                        breakOnSigint: true,
                    };
                    return script.runInContext(persistentContext, runOptions);
                }
                catch (error) {
                    const err = error;
                    node.error(`Script execution error: ${err.message}`, {});
                    throw error;
                }
            },
        };
        done(node, secureVM);
    },
};
exports.default = serverSandboxModule;
