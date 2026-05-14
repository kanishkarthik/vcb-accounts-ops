const {
  SharedMappings,
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");
const path = require("path");

const sharedMappings = new SharedMappings();

sharedMappings.register(
  path.join(__dirname, "tsconfig.json")
);

module.exports = withModuleFederationPlugin({

  name: 'vcb-accounts-ops',

  exposes: {
    './accounts': './src/app/app.ts',
    './accounts_routes': './src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    '@vcb/shared-libs': { singleton: true, strictVersion: false, requiredVersion: 'auto' },

    ...sharedMappings.getDescriptors()
  },

});
