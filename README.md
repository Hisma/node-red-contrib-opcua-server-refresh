# node-red-contrib-opcua-server-refresh

A modern, secure, and TypeScript-powered OPC UA server for Node-RED based on the latest node-opcua library.

[![npm version](https://img.shields.io/npm/v/node-red-contrib-opcua-server-refresh.svg)](https://www.npmjs.com/package/node-red-contrib-opcua-server-refresh)
[![Build Status](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/workflows/Build,%20Test,%20and%20Publish/badge.svg)](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎉 Major Release Updates

This release represents a complete modernization of the OPC UA server with significant improvements in security, reliability, and developer experience.

### 🚀 What's New

- **🔧 Complete TypeScript Migration**: Full type safety and enhanced developer experience
- **🔒 Critical Security Fixes**: Eliminated vulnerabilities with secure VM implementation
- **⚡ Latest node-opcua Support**: Updated to version 2.156.0 with full compatibility
- **✅ Comprehensive Testing**: 61 tests with 100% pass rate ensuring reliability
- **🏗️ Modern Architecture**: Modular design with enhanced error handling

## 📖 About

**NOTE:** This is a fork and modernization of the original `node-red-contrib-opcua-server` by Klaus Landsdorf, which has not been maintained for over 2 years. This updated version was created by Richard Meyer to work with the latest versions of node-opcua and its dependencies, while fixing broken/incomplete features from the original project.

### Key Improvements Over Original

- ✅ **Loading of nodeset XML files** from inside the node configuration
- ✅ **Full OPC UA security policy support** with modern implementations
- ✅ **TypeScript support** for better development experience
- ✅ **Enhanced security** with vm2 vulnerabilities eliminated
- ✅ **Comprehensive test suite** ensuring reliability
- ✅ **Latest dependencies** with active maintenance

## 🔒 Security Enhancements

### Critical Vulnerability Fixes

This version eliminates critical security vulnerabilities present in the original package:

- **CVE-2023-29017** & **CVE-2023-30547**: Replaced vulnerable vm2 library with secure Node.js vm implementation
- **Enhanced VM Sandbox**: Prototype pollution protection and input validation
- **Secure Script Execution**: 5-second timeout limits and enhanced error handling
- **Modern Security Practices**: Following Node.js security best practices

## 🏗️ Core Technology

- **Node.js VM**: Secure sandboxed script execution replacing vulnerable vm2
- **node-opcua 2.156.0**: Latest generation OPC UA library from [Etienne Rossignon](https://github.com/erossignon/)
- **TypeScript**: Full type safety and enhanced development experience
- **Comprehensive Testing**: 61 tests covering all functionality

## 📦 Installation

Run the following command in your Node-RED user directory - typically `~/.node-red`:

```bash
npm install node-red-contrib-opcua-server-refresh
```

### Build from Source (if needed)

If you encounter installation issues, try these options:

```bash
npm install node-red-contrib-opcua-server-refresh --unsafe-perm --build-from-source
```

## 🚀 Quick Getting Started

### Basic Setup

1. **Add the OPC UA Server node** to your Node-RED flow
2. **Configure the endpoint**: Set the endpoint URL (default: `opc.tcp://localhost:54840`)
3. **Deploy your flow**: The server will start automatically

### Default Configuration

A detailed example server is included with pre-populated address space nodes deployed in various formats. If you use the default port `54840`, simply define the endpoint URL in the format:

```
opc.tcp://<node-red-ip>:54840
```

![Screenshot of endpoint configuration](./screenshots/endpoint.png)

### Testing Your Server

We recommend [Prosys OPC UA Browser](https://prosysopc.com/products/opc-ua-browser/) for testing:

1. **Install an OPC UA client** (Prosys is free with email registration)
2. **Connect to your endpoint** using the URL above
3. **Set security to "None"** for initial testing (anonymous login)
4. **Browse the Objects folder** to see your data

![Screenshot of client browser](./screenshots/browser.png)

## 🔧 Advanced Configuration

### Loading Nodeset XML Files

Navigate to the **Users & Sets** tab and enter the **absolute path** to your nodeset XML file.

**Pre-included Nodesets:**
This package includes nodesets in `src/public/nodesets/`. Example path:
```
/root/.node-red/node_modules/node-red-contrib-opcua-server-refresh/src/public/nodesets/Opc.Ua.AutoID.NodeSet2.xml
```

**Validation:**
Successfully loaded nodesets appear in **Types → DataTypes → XML Schema** in your OPC UA client.

![Screenshot of nodeset loading](./screenshots/nodesetxml.png)

### TypeScript Development

For developers working with TypeScript:

```bash
# Development build with source maps
npm run build:dev

# Watch mode for development
npm run watch

# Production build
npm run build:ts
```

### Security Configuration

- **Anonymous Access**: Enabled by default for easy setup
- **User Authentication**: Configure in the Users & Sets tab
- **Certificate Security**: Specify certificate paths for secure connections
- **Security Policies**: Support for modern OPC UA security standards

## 📚 Detailed Guides

For comprehensive setup guides, see our detailed tutorials:

- [Part 1: Deploy a Basic OPC-UA Server in Node-Red](https://flowfuse.com/blog/2023/07/how-to-deploy-a-basic-opc-ua-server-in-node-red/)
- [Part 2: Build a Secure OPC-UA Server with PLC Data](https://flowfuse.com/node-red/protocol/opa-ua/#building-secure-opc-ua-server-in-node-red)
- [Part 3: Build an OPC-UA Client Dashboard](https://flowfuse.com/blog/2023/07/how-to-build-a-opc-client-dashboard-in-node-red/)

## 📋 Examples

Example projects are provided in the `examples` folder:

- **[example-server.json](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/tree/master/examples/example-server.json)**: Basic server configuration
- **[example-with-context.json](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/tree/master/examples/example-with-context.json)**: Dynamic data from flow context

Simply copy the JSON and import into your Node-RED flows.

## 🐛 Debug & Troubleshooting

### Verbose Logging

Enable debug logging for detailed information:

```bash
DEBUG=opcuaCompact* node-red -v 1>Node-RED-OPC-UA-Server.log 2>&1
```

### Common Issues

- **"Cannot read properties of null"**: Check nodeset file path is correct
- **Connection refused**: Verify endpoint URL and port availability
- **Security errors**: Ensure security settings match between client and server

## 🧪 Testing

This package includes comprehensive testing:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Clear test cache
npm run test:clearCache
```

**Test Coverage**: 61 tests covering all functionality with 100% pass rate.

## 🛠️ Development

### Prerequisites

- Node.js 20+
- TypeScript 4.7+
- npm or yarn

### Development Workflow

```bash
# Install dependencies
npm install

# TypeScript development build
npm run build:dev

# Watch mode for development
npm run watch

# Run tests
npm test

# Format code
npm run clean:formatter
```

### Code Style

This project uses Prettier for code formatting. All TypeScript files are automatically formatted on build.

## 📄 License

MIT License - Based on the original work by [Bianco Royal Software Innovations®](https://github.com/BiancoRoyal/)

Copyright (c) 2019 Bianco Royal Software Innovations®  
Forked and modernized by Richard Meyer 2025

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/issues)
- **Node-RED Catalog**: [flows.nodered.org](https://flows.nodered.org/node/node-red-contrib-opcua-server-refresh)
- **Documentation**: This README and inline code documentation

## 🏷️ Keywords

`node-red`, `opcua-server`, `automation`, `iiot`, `typescript`, `security`, `industrial-iot`, `opc-ua`, `scada`
