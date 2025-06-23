import { OPCUAServer, AddressSpace } from "node-opcua";
import { NodeRedNode, FlowContext, GlobalContext } from "./node-red";
import { CoreServerModule } from "./opcua-server";

export interface SandboxContext {
  node: NodeRedNode;
  coreServer: CoreServerModule;
  opcua: any;
  server: OPCUAServer;
  addressSpace: AddressSpace;
  eventObjects: EventObjects;
  sandboxNodeContext: SandboxNodeContext;
  sandboxGlobalContext: SandboxGlobalContext;
  sandboxEnv: SandboxEnv;
  setTimeout: (
    callback: Function,
    delay: number,
    ...args: any[]
  ) => NodeJS.Timeout;
  clearTimeout: (timeoutId: NodeJS.Timeout) => void;
  setInterval: (
    callback: Function,
    delay: number,
    ...args: any[]
  ) => NodeJS.Timeout;
  clearInterval: (intervalId: NodeJS.Timeout) => void;
}

export interface EventObjects extends Record<string, any> {
  sandboxFlowContext?: {
    set: (...args: any[]) => void;
    get: (...args: any[]) => any;
    keys: (...args: any[]) => string[];
  };
}

export interface SandboxNodeContext {
  set: (...args: any[]) => void;
  get: (...args: any[]) => any;
  keys: (...args: any[]) => string[];
  global: GlobalContext;
  flow: FlowContext;
}

export interface SandboxGlobalContext {
  set: (...args: any[]) => void;
  get: (...args: any[]) => any;
  keys: (...args: any[]) => string[];
}

export interface SandboxEnv {
  get: (envVar: string) => any;
}

export interface SecureVM {
  run: (code: string, filename?: string) => any;
}

export interface SandboxModule {
  initialize: (
    node: NodeRedNode,
    coreServer: CoreServerModule,
    opcuaLibrary: any,
    server: OPCUAServer,
    addressSpace: AddressSpace,
    eventObjects: EventObjects,
    done: (node: NodeRedNode, vm: SecureVM) => void
  ) => void;
}

export interface VMScript {
  runInContext: (context: any, options?: VMRunOptions) => any;
}

export interface VMRunOptions {
  timeout?: number;
  displayErrors?: boolean;
  breakOnSigint?: boolean;
}
