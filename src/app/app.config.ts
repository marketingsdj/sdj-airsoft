import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // 'disabled' para que el servicio custom gestione el scroll manualmente
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'disabled', anchorScrolling: 'enabled' }))
  ]
};
