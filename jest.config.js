const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig.base.json')

module.exports = {
  preset: 'ts-jest'
, testEnvironment: 'node'
, testMatch: ['**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)']
, resolver: 'jest-ts-webcompat-resolver'
, moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  })
}
