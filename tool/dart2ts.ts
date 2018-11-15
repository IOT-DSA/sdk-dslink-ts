import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string) {
  fs.readdirSync(dir).forEach((file) => {
    console.log(`converting ${file}`);
    file = path.resolve(dir, file);
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else {
      if (file.endsWith('.dart')) {
        dart2ts(file);
      }
    }
  });
}

let fixFunctionReturn = /\b([A-Z]\w+( *<[\w, ]+>)?|bool|int|string|num|void) (\w+\([^\)]*\)) \{\n/g;

function replaceFunctionReturn(match, p1, p2, p3, offset, str) {

  if (p1 === 'num' || p1 === 'int') {
    p1 = 'number';
  }
  if (p3.endsWith('])')) {
    // fix optional parameters
    p3 = p3.replace('[', '').replace('])', ')');
  }
  if (p1 === 'void') {
    return `${p3} {\n`;
  }
  return `${p3}:${p1} {\n`;
}

let fixVariable = /(\n +)?\b([A-Z]\w+( *<[\w, ]+>)?|bool|int|string|num) ([a-z_]\w+)(;|\)|,| =)/g;

// let varCache = {};
function replaceVariable(match, p1, p2, p3, p4, p5, offset, str) {
  if (p1 === 'num' || p1 === 'int') {
    p1 = 'number';
  }
  if (p1) {
    if (p1.length === 3) { // probably class property
      // varCache[p4] = true;
      return `${p1}${p4}: ${p2}${p5}`;
    }
    if (p1.length > 5) { // local variable
      return `${p1}let ${p4}: ${p2}${p5}`;
    }
  }
  return `${p1}${p4}: ${p2}${p5}`;
}

let fixGetter = /\b([A-Z]\w+( *<[\w, ]+>)?|bool|int|string|num) get ([a-z_]\w+)( => (\w+);| *{)/g;

function replaceGetter(match, p1, p2, p3, p4, p5, offset, str) {
  if (p1 === 'num' || p1 === 'int') {
    p1 = 'number';
  }
  if (p4 === ' {') {
    return `get ${p3}(): ${p1} {`;
  } else {
    return `get ${p3}(): ${p1} { return ${p5};}`;
  }

}

let fixFunctionType = /typedef (\w+) (\w+)(\([^\)]+\));/g;

function replaceFunctionType(match, p1, p2, p3, offset, str) {
  if (p2 === 'ValueUpdater') {
    return 'export type ValueUpdater = (obj: object, noCache: bool) => void | { call: (this_: any, obj: object, noCache: bool) => void };';
  }
  return `export type ${p2} = ${p3} => ${p1};`;
}

let fixPrivateProperty = /(return|[><=,\(\+\-\*\/\|&]) *(_\w+ *[;\.><=,\(\)\+\-\*\/\|&!])/g;

let fixMap = /Map *< *[sS]tring, *(\w+) *>/g;
let fixList = /List *< *(\w+) *>/g;
let fixClass = /\n(class [A-Z]\w+)( +extends| +implements| *\{)/g;

let fixIs = /([\(&|]) *(\w+) is (\w+) *([\)&|])/g;
let fixIsNot = /([\(&|]) *(\w+) is! (\w+) *([\)&|])/g;

function replaceIs(match, p1, p2, p3, p4, offset, str) {
  if (p3 === 'string') {
    return `${p1} typeof ${p2} === 'string' ${p4}`;
  }
  if (p3 === 'num' || p3 === 'int') {
    return `${p1} typeof ${p2} === 'number' ${p4}`;
  }
  if (p3 === 'bool') {
    return `${p1} typeof ${p2} === 'boolean' ${p4}`;
  }
  if (p3 === 'List') {
    return `${p1} Array.isArray(${p2}) ${p4}`;
  }
  if (p3 === 'object') {
    return `${p1} (${p2} != null && ${p2} instanceof Object) ${p4}`;
  }
  return `${p1} ${p2} instanceof ${p3} ${p4}`;
}

function replaceIsNot(match, p1, p2, p3, p4, offset, str) {
  if (p3 === 'string') {
    return `${p1} typeof ${p2} !== 'string' ${p4}`;
  }
  if (p3 === 'num' || p3 === 'int') {
    return `${p1} typeof ${p2} !== 'number' ${p4}`;
  }
  if (p3 === 'bool') {
    return `${p1} typeof ${p2} !== 'boolean' ${p4}`;
  }
  if (p3 === 'List') {
    return `${p1} !Array.isArray(${p2}) ${p4}`;
  }
  if (p3 === 'object') {
    return `${p1} (${p2} == null || !(${p2} instanceof Object)) ${p4}`;
  }
  return `${p1} !(${p2} instanceof ${p3}) ${p4}`;
}

function dart2ts(file: string) {
  let str = fs.readFileSync(file, "utf8");
  str = str.replace(/\r\n/g, '\n');
  str = str.replace(fixFunctionReturn, replaceFunctionReturn); // function define
  str = str.replace(fixGetter, replaceGetter); // getter
  str = str.replace(/\bvoid (set \w+\()/g, '$1'); // setter
  str = str.replace(fixVariable, replaceVariable); // variable define
  str = str.replace(fixMap, '{[key: string]: $1}'); // map structure
  str = str.replace(/\bMap\b/g, 'object'); // map with no template
  str = str.replace(fixList, '$1[]'); // list structure
  str = str.replace(fixFunctionType, replaceFunctionType); // function type and functor 
  str = str.replace(fixPrivateProperty, '$1 this.$2'); // add this. in front of _property
  str = str.replace(fixClass, '\nexport $1 $2'); // export class
  str = str.replace(/\bString\b/g, 'string'); // String -> string
  str = str.replace(/\bObject\b/g, 'object'); // Object -> object
  str = str.replace(/\bbool\b/g, 'boolean'); // bool -> boolean
  str = str.replace(/\bHashSet</g, 'Set<'); // HashSet -> Set
  str = str.replace(/\static final /g, 'static readonly '); // final -> readonly
  str = str.replace(/\babstract class\b/g, 'export interface'); // abstract class -> export interface
  str = str.replace(fixClass, '\nexport $1 $2'); // export class
  str = str.replace(/^(part of [\w\.]+;)/g, '// $1'); // comment out part of
  str = str.replace(fixIs, replaceIs); // instance of
  str = str.replace(fixIsNot, replaceIsNot); // not instance of
  fs.writeFileSync(file.replace(/.dart$/, '.ts'), str);
}

walk('lib/src/responder');
walk('lib/src/browser');