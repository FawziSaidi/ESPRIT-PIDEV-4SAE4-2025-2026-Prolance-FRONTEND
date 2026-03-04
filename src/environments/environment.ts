// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,

  // Tout passe par l'API Gateway (port 8222)
  authServiceUrl:        'http://localhost:8222/api/auth',
  eventServiceUrl:       'http://localhost:8222/api/events',
  activityServiceUrl:    'http://localhost:8222/api/activities',
  inscriptionServiceUrl: 'http://localhost:8222/api/inscriptions',

  // Ads service (pas dans le gateway, port direct)
  adsServiceUrl:         'http://localhost:8090/ads-service/api'
};
