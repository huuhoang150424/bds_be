module.exports = {
  apps: [
    {
      name: 'bds',
      script: 'src/index.ts',
      interpreter: 'node',
      watch: true,
      ignore_watch: ['node_modules', 'dist'],
      env: {
        NODE_ENV: 'development',
        TS_NODE_PROJECT: 'tsconfig.json',
      },
      node_args: '-r ts-node/register -r tsconfig-paths/register',
    },
  ],
};
