import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

/** The server's configuration: the browser's, plus server rendering of every route (`app.routes.server.ts`). */
export const config = mergeApplicationConfig(appConfig, serverConfig);
