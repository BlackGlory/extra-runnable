import { setTimeout } from 'timers'

export function delay(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout).unref()
  })
}
