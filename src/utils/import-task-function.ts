import { TaskFunction } from '@src/types.js'
import { isFunction, isObject } from '@blackglory/prelude'

export async function importTaskFunction<Result, Params>(
  filename: string
): Promise<TaskFunction<Result, Params>> {
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

  throw new Error('Invalid task function')
}
