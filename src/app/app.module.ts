import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './services/jwt.interceptor';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
// import { AuthInterceptor } from './services/auth.interceptor';

import { IonicStorageModule } from '@ionic/storage-angular';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';

import { PresencePromptComponent } from './components/presence-prompt/presence-prompt.component';

const firebaseConfig = {
  apiKey: "AIzaSyAgXFtEtlxPNcHwAHSxT2i4uWMql3EzjL0",
  authDomain: "sigpe-7aef8.firebaseapp.com",
  projectId: "sigpe-7aef8",
  storageBucket: "sigpe-7aef8.firebasestorage.app",
  messagingSenderId: "336925196017",
  appId: "1:336925196017:web:f9a0a0f3b2b95cfa55f350",
  measurementId: "G-1YBZ37QQ2Q"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
registerLocaleData(localeFr);

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule, 
    CommonModule, 
    HttpClientModule,
    IonicStorageModule.forRoot(),
    PresencePromptComponent
    // FormsModule,
    // ReactiveFormsModule
  ],
  providers: [
    FirebaseX,
    // Fournisseur pour la stratégie de réutilisation de route
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'fr' },
    // Fournisseur pour l'intercepteur JWT (séparé)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },

    // Fournisseur pour l'intercepteur Auth (ajoute le token à certaines requêtes)
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: AuthInterceptor,
    //   multi: true
    // }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
