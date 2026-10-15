export function isOwnKey<T extends object>(object: T, key: string): key is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(object, key)
}
