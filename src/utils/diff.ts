import { diff } from "deep-object-diff";

export const compareObject = (a: any, b: any) => {
  if (a == null) {
    a = {}
  }
  if (b == null) {
    b = {}
  }
  return diff(a, b);
}

export const isAnyFieldChanged = (fields: Array<string>, a: any, b: any) => {
  const changes = compareObject(a, b);
  const changedFields = Object.keys(changes)
  console.log(`${changedFields.length} fields changed: ` + changedFields)
  return fields.some((key) => changedFields.includes(key))
}