import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { CommonModule } from '@angular/common'; // Importez CommonModule
//import { SidebarComponent } from './components/sidebar/sidebar.component'; // Importez SidebarComponent
// import { SwiperModule } from 'swiper/angular';


@NgModule({
  declarations: [AppComponent], //declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, CommonModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  //exports: [SidebarComponent], // Assure-toi d'exporter le composant
  bootstrap: [AppComponent],
})
export class AppModule {}
