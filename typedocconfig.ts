module.exports = {
  src: [
    './ts/web.ts',
    './ts/src/browser/browser-user-link.ts',
    './ts/src/requester/requester.ts',
    './ts/src/requester/node_cache.ts',
    './ts/src/requester/request',
    './ts/src/utils/async.ts',
  ],
  mode: 'file',
  tsconfig: 'tsconfig.json',
  out: './docs',
  excludePrivate: true,
  excludeProtected: true,
  excludeExternals: true,
  readme: 'docIndex.md',
  name: 'DSLink SDK',
  ignoreCompilerErrors: true,
  plugin: 'none'
};