import { ITaskModule, IMetaModule } from '@src/types.js'
import { isFunction, isObject, isUndefined } from '@blackglory/types'

export async function importTaskModule<T>(filename: string): Promise<ITaskModule<T>> {
  const module = await import(filename)

  // module.exports = function () {}
  if (isFunction(module)) {
    return { default: module }
  }

  // export default function() {}
  if (isObject(module) && isFunction(module.default)) {
    return { default: module.default }
  }

  // exports.default = function() {}
  if (isObject(module) && isObject(module.default) && isFunction(module.default.default)) {
    return { default: module.default.default }
  }

  throw new Error('Invalid task module')
}

export async function importMetaModule<T>(filename: string): Promise<IMetaModule<T>> {
  const module = await import(filename)

  if (
    isObject(module) &&
    (isFunction(module.init) || isUndefined(module.init)) &&
    (isFunction(module.final) || isUndefined(module.final))
  ) {
    return module as IMetaModule<T>
  }

  if (
    isObject(module.default) &&
    (isFunction(module.default.init) || isUndefined(module.default.init)) &&
    (isFunction(module.default.final) || isUndefined(module.default.final))
  ) {
    return module.default as IMetaModule<T>
  }

  throw new Error('Invalid meta module')
}
