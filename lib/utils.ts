export function buildEnumType(values: string[]) {
  return `enum[${values.join(',')}]`;
}