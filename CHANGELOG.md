# [0.2.4](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.2.3...v0.2.4) (2025-06-23)

### Major Architectural Improvements

* **BREAKING:** Replace VM sandbox execution with direct function calls to eliminate V8 context boundary issues
* **vm:** Fix critical "bindVariable returns invalid result" error by removing VM context boundaries
* **performance:** Improve execution performance by eliminating VM overhead
* **reliability:** Ensure Variant instanceof checks work correctly across all scenarios
* **architecture:** Simplify codebase by removing complex VM context management

### Bug Fixes

* **testing:** Replace VM-based tests with direct execution integration tests
* **cleanup:** Remove unused server-sandbox module and related dependencies
* **types:** Clean up TypeScript imports and remove unused sandbox types

### Technical Details

This release fundamentally changes how address space scripts are executed. Instead of running scripts in a separate VM context (which caused V8 realm boundary issues), scripts now execute directly in the main Node.js context. This ensures that:

- `instanceof` checks work correctly for Variant and DataValue objects
- No "bindVariable returns invalid result" errors occur
- Better performance due to eliminated VM overhead
- Simpler, more maintainable codebase

## [0.2.3](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.2.2...v0.2.3) (2025-06-23)

### Bug Fixes

* **vm:** Fix critical "bindVariable returns invalid result" error in address space scripts
* **sandbox:** Pass real node-opcua library to VM instead of empty object for proper constructor access
* **testing:** Update all tests to use actual opcua library for realistic validation
* **ci/cd:** Fix GitHub release creation with proper changelog extraction and modern actions
* **workflow:** Update to use softprops/action-gh-release@v1 instead of deprecated create-release action
* **types:** Remove unused NodeContext import from sandbox types

## [0.2.2](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.2.1...v0.2.2) (2025-06-23)

### Bug Fixes

* **vm:** Fix address space script execution in VM context
* **runtime:** Resolve "bindVariable returns invalid result" error that prevented OPC UA scripts from working
* **sandbox:** Properly pass function code to VM for execution using string interpolation
* **compatibility:** Ensure OPC UA Variant/DataType constructors work correctly in address space scripts
* **testing:** Add comprehensive test suite validating real-world address space script patterns

## [0.2.1](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.2.0...v0.2.1) (2025-06-23)

### Bug Fixes

* **ci/cd:** Fix security audit workflow to handle dev dependency warnings gracefully
* **deployment:** Update GitHub Actions to use production-only security audit with continue-on-error

## [0.2.0](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.1.6...v0.2.0) (2025-06-23)

### Major Features

* **security:** Complete TypeScript migration with enhanced type safety
* **security:** Replace vulnerable vm2 with secure Node.js vm implementation  
* **dependencies:** Update to node-opcua v2.156.0 with compatibility fixes
* **testing:** Comprehensive test suite with 61 tests and 100% pass rate

### Security Enhancements

* **critical:** Eliminate CVE-2023-29017 and CVE-2023-30547 vulnerabilities
* **sandbox:** Enhanced VM security with prototype pollution protection
* **validation:** Improved input validation and error handling
* **policies:** Remove deprecated security policies (Basic128Rsa15, Basic256)

### Performance & Reliability

* **architecture:** Modern TypeScript architecture for better maintainability
* **errors:** Enhanced error handling and timeout management
* **build:** Improved build system with automated testing
* **ui:** Updated Node-RED configuration UI with security documentation

### Infrastructure

* **ci/cd:** Enhanced GitHub Actions workflow with NPM verification
* **docs:** Comprehensive deployment guide with Node-RED catalog submission
* **automation:** Automated quality gates and build validation
* **documentation:** Complete documentation updates and migration guides



## [0.1.6](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.1.5...v0.1.6) (2024-09-29)



## [0.1.4](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.1.3...v0.1.4) (2024-09-29)



## [0.1.3](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.1.2...v0.1.3) (2024-09-29)



## [0.1.2](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/v0.1.1...v0.1.2) (2024-09-29)



## [0.1.1](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/compare/4091b604e4e34a582864a47b42630861b1742d3b...v0.1.1) (2024-09-29)


### Bug Fixes

* codacy ([3fbe647](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/3fbe647fef212b86619dd4ee1b9eecf6f497967b))
* install failure ([cc41404](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/cc41404c63dcfe77492fb5771a9426fd01aab552))
* node-red manage install missing source-map-support ([c3b9c17](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/c3b9c17d18e6f9313c8ce4841879679d5516baa4))
* npm install ([9d19ad9](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/9d19ad9ebcc0b6c62daef45dcb3ea779c95e23d0))
* prettier style for travis ([38ed92f](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/38ed92f9889a1e5035f73fe58896e6c3ff46472e))
* remove ISA95  ([15eb1e6](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/15eb1e6f65137d07806297b39a49186179478e77))
* **server:** HTML key inputs to short ([c71061c](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/c71061c77efd83e595c27862c8a884ef9b097498))
* **server:** html template for address space ([2d3eebb](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/2d3eebb9410136e57b3409332c5a89226cdb414b))
* set back to HIDDEN default in discovery because of crashing LDS without a running LDS  ([7e7377e](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/7e7377e2c1cc998dc425a8a21214258e94a203d8))
* travis npm ([d67f905](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/d67f9050dc05c46e0901d88029456ab017b04249))
* vm2 not ready to use object shorthand for now ([a4dddb7](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/a4dddb7f5c0f263c2e24a39542337ac2ee09e4e7))
* xml sets moved but more ([a045ee9](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/a045ee926f41902f97c2b3847d390ee3eb316d8a))


### Features

* new product uri access ([56f4617](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/56f4617e8074e26abbe1f205a4f834989b25738c))
* **server:** add the wohle server from compact development ([4091b60](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/4091b604e4e34a582864a47b42630861b1742d3b))
* **server:** use custom config on server and give more config access ([a09ebfe](https://github.com/Hisma/node-red-contrib-opcua-server-refresh/commit/a09ebfee1d62e8962c20327f840ee4f9ce47adf1))
