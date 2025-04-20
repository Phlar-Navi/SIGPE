import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { JustificationPageRoutingModule } from './justification-routing.module';

import { JustificationPage } from './justification.page';
import { SidebarComponent } from 'src/app/components/sidebar/sidebar.component';
import { HeaderComponent } from 'src/app/components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    JustificationPageRoutingModule,
    SidebarComponent,
    HeaderComponent
  ],
  declarations: [JustificationPage]
})
export class JustificationPageModule {}
