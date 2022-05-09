import { IModule } from '@src/types.js'
import { isFunction, isObject, isUndefined } from '@blackglory/prelude'

export async function importTaskModule<Result, Params>(
  filename: string
): Promise<IModule<Result, Params>> {
  const module = await import(filename)

  // module.exports = function () {}
  if (
    (isFunction(module.init) || isUndefined(module.init)) &&
    (isFunction(module.final) || isUndefined(module.final)) &&
    isFunction(module)
  ) {
    return {
      ...module
    , default: module
    }
  }

  // export default function() {}
  if (
    (isFunction(module.init) || isUndefined(module.init)) &&
    (isFunction(module.final) || isUndefined(module.final)) &&
    isObject(module) && isFunction(module.default)
  ) {
    return {
      ...module
    , default: module.default
    }
  }

  // exports.default = function() {}
  if (
    (isFunction(module.default.init) || isUndefined(module.default.init)) &&
    (isFunction(module.default.final) || isUndefined(module.default.final)) &&
    isObject(module) && isObject(module.default) && isFunction(module.default.default)
  ) {
    return {
      ...module.default
    , default: module.default.default
    }
  }

  throw new Error('Invalid task module')
}
