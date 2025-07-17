# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.0.0](https://github.com/BlackGlory/consumer/compare/v3.0.1...v4.0.0) (2025-07-14)


### ⚠ BREAKING CHANGES

* Removed support for registry, rpc, cli
* Node.js v16 => v22

### Features

* remove support for registry, rpc, cli ([f30683e](https://github.com/BlackGlory/consumer/commit/f30683e3f7a41430a426cb1f03318d5b2499ce33))


* upgrade dependencies ([f5e89bc](https://github.com/BlackGlory/consumer/commit/f5e89bc5b3d11b96717b9ea29468beadd39270d6))

### [3.0.1](https://github.com/BlackGlory/consumer/compare/v3.0.0...v3.0.1) (2023-01-28)


### Bug Fixes

* remove bundle because webpack does not support esm output ([77fc3dc](https://github.com/BlackGlory/consumer/commit/77fc3dc36b93d20203885011e4359998f948d0cf))

## [3.0.0](https://github.com/BlackGlory/consumer/compare/v2.1.2...v3.0.0) (2023-01-28)


### ⚠ BREAKING CHANGES

* The minimal version of Node.js is 16

### Bug Fixes

* option types ([634c0fd](https://github.com/BlackGlory/consumer/commit/634c0fd0e22d9fc145d1239218a852e083389a06))


* upgrade dependencies ([b8d259c](https://github.com/BlackGlory/consumer/commit/b8d259c8a77a179e879300b13723c1d8da1e5c01))

### [2.1.2](https://github.com/BlackGlory/consumer/compare/v2.1.1...v2.1.2) (2022-08-01)

### [2.1.1](https://github.com/BlackGlory/consumer/compare/v2.1.0...v2.1.1) (2022-08-01)

## [2.1.0](https://github.com/BlackGlory/consumer/compare/v2.0.5...v2.1.0) (2022-08-01)


### Features

* set process.title ([ab06b20](https://github.com/BlackGlory/consumer/commit/ab06b20329e8d744754af0ae0faa41916cbce1f7))

### [2.0.5](https://github.com/BlackGlory/consumer/compare/v2.0.4...v2.0.5) (2022-07-31)


### Bug Fixes

* cli name ([d229720](https://github.com/BlackGlory/consumer/commit/d229720da23ae316e31f297bc00db611b3786d2a))

### [2.0.4](https://github.com/BlackGlory/consumer/compare/v2.0.3...v2.0.4) (2022-07-30)


### Bug Fixes

* cli ([faf911c](https://github.com/BlackGlory/consumer/commit/faf911c5e93c8251496d00687ba472712d854201))

### [2.0.3](https://github.com/BlackGlory/consumer/compare/v2.0.2...v2.0.3) (2022-07-30)

### [2.0.2](https://github.com/BlackGlory/consumer/compare/v2.0.1...v2.0.2) (2022-07-30)

### [2.0.1](https://github.com/BlackGlory/consumer/compare/v2.0.0...v2.0.1) (2022-07-25)


### Bug Fixes

* cli options ([5f4ccba](https://github.com/BlackGlory/consumer/commit/5f4ccba2236c0903e654812d96db5f5f04559039))

## [2.0.0](https://github.com/BlackGlory/consumer/compare/v1.0.0...v2.0.0) (2022-06-23)


### ⚠ BREAKING CHANGES

* The CLI name is changed
* All RPC related APIs are removed

### Features

* add support for `channel` of delight-rpc ([7075f57](https://github.com/BlackGlory/consumer/commit/7075f57ceceed8397a98b81f74e81c75af14701b))
* remove all RPC related APIs ([a847293](https://github.com/BlackGlory/consumer/commit/a8472933b810c0feba1fe2ef19fe357ba99ba004))


* rename `run-consumers` to `run-consumer-module` ([d950077](https://github.com/BlackGlory/consumer/commit/d95007761f484fe0a1e6c65f0f47398828921270))

## [1.0.0](https://github.com/BlackGlory/consumer/compare/v0.5.0...v1.0.0) (2022-06-20)


### ⚠ BREAKING CHANGES

* rewrite

### Features

* add manually quitting support ([2fcaa8e](https://github.com/BlackGlory/consumer/commit/2fcaa8ea388690cd618f986cfe0691f5f513a278))
* rewrite ([5eef0a5](https://github.com/BlackGlory/consumer/commit/5eef0a5dec3804fcf48d5028532fdd9a783644f4))
* rewrite ([82366e3](https://github.com/BlackGlory/consumer/commit/82366e377d85fa6cd117b9089aa774a7d5a107ca))

## [0.5.0](https://github.com/BlackGlory/gado/compare/v0.4.0...v0.5.0) (2022-05-07)


### ⚠ BREAKING CHANGES

* remove observeConcurrency

### Features

* remove observeConcurrency ([7a754ce](https://github.com/BlackGlory/gado/commit/7a754ce91fc77f0e3b1dee5c1959619b459e4e5c))

## [0.4.0](https://github.com/BlackGlory/gado/compare/v0.3.9...v0.4.0) (2022-05-05)


### ⚠ BREAKING CHANGES

* MetaModule removed

### Features

* merge MetaModule into TaskModule ([da59cb5](https://github.com/BlackGlory/gado/commit/da59cb55ac5de38800b7b60a5983c76b4444a1fc))

### [0.3.9](https://github.com/BlackGlory/gado/compare/v0.3.8...v0.3.9) (2022-04-29)

### [0.3.8](https://github.com/BlackGlory/gado/compare/v0.3.7...v0.3.8) (2022-03-29)


### Features

* export IMetaModule, ITaskModule ([072ed1f](https://github.com/BlackGlory/gado/commit/072ed1f7a8475ae62916e1152a9e4ae968ccf8a5))

### [0.3.7](https://github.com/BlackGlory/gado/compare/v0.3.6...v0.3.7) (2022-03-14)


### Features

* export version ([f096a8a](https://github.com/BlackGlory/gado/commit/f096a8a8f63a872b1c3bb613fdd22751b05934e2))

### [0.3.6](https://github.com/BlackGlory/gado/compare/v0.3.5...v0.3.6) (2022-03-14)

### [0.3.5](https://github.com/BlackGlory/gado/compare/v0.3.4...v0.3.5) (2022-03-13)


### Features

* export IAPI ([8479bdd](https://github.com/BlackGlory/gado/commit/8479bdda49c858b6f9cd13f16f5aa8d199665c70))

### [0.3.4](https://github.com/BlackGlory/gado/compare/v0.3.3...v0.3.4) (2022-03-09)

### [0.3.3](https://github.com/BlackGlory/gado/compare/v0.3.2...v0.3.3) (2022-03-09)

### [0.3.2](https://github.com/BlackGlory/gado/compare/v0.3.1...v0.3.2) (2022-03-07)

### [0.3.1](https://github.com/BlackGlory/gado/compare/v0.3.0...v0.3.1) (2022-02-21)

## [0.3.0](https://github.com/BlackGlory/gado/compare/v0.2.5...v0.3.0) (2022-02-15)


### ⚠ BREAKING CHANGES

* - requires Node.js `^12.20.0 || ^14.13.1 || >=16.0.0`
- use delight-rpc 2.0 protocol

### Features

* add ESM support ([f627093](https://github.com/BlackGlory/gado/commit/f62709389fb19f5cdd51e9fb09497a8edb8a9480))
* add IMetaModule.observeConcurrency ([218373a](https://github.com/BlackGlory/gado/commit/218373a1cf6881d817d9df051c851677d3c85618))

### [0.2.5](https://github.com/BlackGlory/gado/compare/v0.2.4...v0.2.5) (2022-02-13)

### [0.2.4](https://github.com/BlackGlory/gado/compare/v0.2.3...v0.2.4) (2021-12-22)


### Bug Fixes

* support Node.js v14 ([53116b4](https://github.com/BlackGlory/gado/commit/53116b42412ffe1e0aad7c99f0148a62263cb811))

### [0.2.3](https://github.com/BlackGlory/gado/compare/v0.2.2...v0.2.3) (2021-12-21)

### [0.2.2](https://github.com/BlackGlory/gado/compare/v0.2.1...v0.2.2) (2021-12-17)

### [0.2.1](https://github.com/BlackGlory/gado/compare/v0.2.0...v0.2.1) (2021-12-17)

## [0.2.0](https://github.com/BlackGlory/gado/compare/v0.1.1...v0.2.0) (2021-12-16)


### ⚠ BREAKING CHANGES

* - The minimum version is Node.js v16

* upgrade dependencies ([3508864](https://github.com/BlackGlory/gado/commit/3508864529cd2ae1750bc29b04e2266b28b44d6e))

### 0.1.1 (2021-12-13)


### Features

* rewrite ([6990d6c](https://github.com/BlackGlory/gado/commit/6990d6c8837e091b9cec9a4882f00ae9d729410b))
