module.exports = {
  apps: [
    {
      name: 'bds',
      script: 'src/index.ts', 
      interpreter: 'ts-node',
      watch: true,
      ignore_watch: ['node_modules', 'dist'],
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};