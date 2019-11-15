export function buildEnumType(values: string[]) {
  return `enum[${values.join(',')}]`;
}

export const DSA_VERSION = '1.1.2';
