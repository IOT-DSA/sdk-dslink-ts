module.exports = {
  src: [
    './ts/web.ts',
    './ts/src/browser/browser_user_link.ts',
    './ts/src/requester/requester.ts',
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