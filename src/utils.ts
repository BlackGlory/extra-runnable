import { isFunction, isObject } from '@blackglory/prelude'
import { PrimitiveRunnableFunction } from '@src/types.js'

export async function importModule<Result, Args extends unknown[]>(filename: string): Promise<PrimitiveRunnableFunction<Result, Args>> {
  const module = await import(filename)

  // module.exports = function () {}
  if (isFunction(module)) {
    return module
  }

  // export default function() {}
  if (isObject(module) && isFunction(module.default)) {
    return module.default
  }

  // exports.default = function() {}
  if (isObject(module) && isObject(module.default) && isFunction(module.default.default)) {
    return module.default.default
  }

  throw new Error('Invalid module')
}
