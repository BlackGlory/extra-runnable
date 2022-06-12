# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.0.1](https://github.com/BlackGlory/extra-runnable/compare/v3.0.0...v3.0.1) (2022-06-12)

## [3.0.0](https://github.com/BlackGlory/extra-runnable/compare/v2.0.0...v3.0.0) (2022-06-12)


### ⚠ BREAKING CHANGES

* It is an ESM now.

### Features

* add RunnableModule, RunnableModuleAsThread, RunnableModuleAsProcess ([451eda8](https://github.com/BlackGlory/extra-runnable/commit/451eda8b939d11d12bb3185cfddbbd21ca8e53f0))

## [2.0.0](https://github.com/BlackGlory/extra-runnable/compare/v1.0.0...v2.0.0) (2022-06-11)


### ⚠ BREAKING CHANGES

* - `Runnable` => `Runner`
- `RunnableState` => `RunnerState`
- `IAdapter` => `Runnable`
- `AsyncAdapter` => `RunnableFunction`

* rename ([135e013](https://github.com/BlackGlory/extra-runnable/commit/135e013ca9bccf289bf490357525cfeb82554969))

## [1.0.0](https://github.com/BlackGlory/extra-runnable/compare/v0.7.2...v1.0.0) (2022-06-10)


### ⚠ BREAKING CHANGES

* - `Task` => `Runnable`
- `TaskState` => `RunnableState`
- `TaskFunction` => `RunnableFunction`

### Features

* rename package name ([3bc8673](https://github.com/BlackGlory/extra-runnable/commit/3bc86730122b5017c88ed4243ccbf1efdab0d143))

### [0.7.2](https://github.com/BlackGlory/boso/compare/v0.7.1...v0.7.2) (2022-06-08)

### [0.7.1](https://github.com/BlackGlory/boso/compare/v0.7.0...v0.7.1) (2022-06-05)

## [0.7.0](https://github.com/BlackGlory/boso/compare/v0.6.1...v0.7.0) (2022-05-25)


### ⚠ BREAKING CHANGES

* rewrite

### Features

* rewrite ([4471fd9](https://github.com/BlackGlory/boso/commit/4471fd9480b6a5db11082f59a9a8614a2df1d96b))

### [0.6.1](https://github.com/BlackGlory/boso/compare/v0.6.0...v0.6.1) (2022-05-18)


### Features

* improve the return value of TaskFunction ([975e10a](https://github.com/BlackGlory/boso/commit/975e10a06d12b5169c737aa7f7146a660a6b8e34))

## [0.6.0](https://github.com/BlackGlory/boso/compare/v0.5.0...v0.6.0) (2022-05-18)


### ⚠ BREAKING CHANGES

* `getStatus` => `getState`

* rename `getStatus` to `getState` ([a28bb08](https://github.com/BlackGlory/boso/commit/a28bb088f6f50c9f1d4b79d3dc90ddd774786de0))

## [0.5.0](https://github.com/BlackGlory/boso/compare/v0.4.1...v0.5.0) (2022-05-17)


### ⚠ BREAKING CHANGES

* - remove `AsyncModuleAdapter`, `ThreadAdapter`, `ProcessAdapter`
- rename `AsyncFunctionAdapter` to `AsyncAdapter`

### Features

* rewrite ([2010826](https://github.com/BlackGlory/boso/commit/20108262716b7139404db3666807ccce5eff67a3))

### [0.4.1](https://github.com/BlackGlory/boso/compare/v0.4.0...v0.4.1) (2022-05-17)

## [0.4.0](https://github.com/BlackGlory/boso/compare/v0.3.0...v0.4.0) (2022-05-14)


### ⚠ BREAKING CHANGES

* rewrite

### Features

* rewrite ([130b38a](https://github.com/BlackGlory/boso/commit/130b38a831394248e4be2787784363e4e67691e9))

## [0.3.0](https://github.com/BlackGlory/boso/compare/v0.2.1...v0.3.0) (2022-05-12)


### ⚠ BREAKING CHANGES

* - Rename `AsyncTask` to `AsyncTaskFromModule`
- Rename `ProcessTask` to `ProcessTaskFromModule`
- Rename `ThreadTask` to `ThreadTaskFromModule`

### Features

* add AsyncTaskFromFunction ([73e3fee](https://github.com/BlackGlory/boso/commit/73e3feecd6c6674a9060de79e2b6a6678f0ad1d7))

### [0.2.1](https://github.com/BlackGlory/boso/compare/v0.2.0...v0.2.1) (2022-05-10)

## [0.2.0](https://github.com/BlackGlory/boso/compare/v0.1.2...v0.2.0) (2022-05-10)


### ⚠ BREAKING CHANGES

* generic Params => Args

### Features

* allow more arguments ([baf26f3](https://github.com/BlackGlory/boso/commit/baf26f3c015a142879d53b437437a31d5d241746))

### [0.1.2](https://github.com/BlackGlory/boso/compare/v0.1.1...v0.1.2) (2022-05-10)

### [0.1.1](https://github.com/BlackGlory/boso/compare/v0.1.0...v0.1.1) (2022-05-09)

## 0.1.0 (2022-05-09)


### Features

* init ([d948b27](https://github.com/BlackGlory/boso/commit/d948b27f159929de037d02faa3b84708d0e6a818))
