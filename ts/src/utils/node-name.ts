// need this table to encode string in upper case
const ENCODE_TABLE = '0123456789ABCDEF'.split('');

function escapeNodeName(match: string) {
  let code = match.charCodeAt(0);
  return `%${ENCODE_TABLE[(code / 16) >> 0]}${ENCODE_TABLE[code % 16]}`;
}

export function encodeNodeName(name: string) {
  return name.replace(/[\u0000-\u001f/\\?*:|"<>%,\u007f]/g, escapeNodeName);
}

export function decodeNodeName(name: string) {
  return decodeURIComponent(name);
}

/**
 * decode dsa enum string in the format of [optionA,optionB,optionC]
 * @param enums
 */
export function decodeEnums(enums: string) {
  let targetString = enums;
  if (targetString.startsWith('[') && targetString.endsWith(']')) {
    targetString = targetString.substring(1, targetString.length - 1);
  }
  return targetString.split(',').map((s) => decodeNodeName(s));
}
