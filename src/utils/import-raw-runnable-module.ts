import { isFunction, isUndefined } from '@blackglory/prelude'
import { MapPropsToRequiredByKey } from 'hotypes'
import { IRawRunnableModule } from '@src/types.js'
import { pathToFileURL } from 'url'
import { appendSearchParam } from 'url-operator'
import { nanoid } from 'nanoid'

export async function importRawRunnableModule<Args extends unknown[], Result>(
  filename: string
): Promise<MapPropsToRequiredByKey<IRawRunnableModule<Args, Result>, 'destroy'>> {
  const url = appendSearchParam(
    new URL(pathToFileURL(filename))
  , 'id'
  , nanoid()
  ).href

  const module = await import(url)

  if (
    isFunction(module.default) &&
    (isFunction(module.destroy) || isUndefined(module.destroy))
  ) {
    return {
      default: module.default
    , destroy: module.destroy
    }
  }

  throw new Error('Invalid runnable module')
}
