const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig.test.json')

module.exports = {
  preset: 'ts-jest'
, testEnvironment: 'node'
, testMatch: ['**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)']
, moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  })
}
