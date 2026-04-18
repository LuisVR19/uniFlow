import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { AddEventPageRoutingModule } from './add-event-routing.module';
import { AddEventPage } from './add-event.page';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, AddEventPageRoutingModule, TranslateModule],
  declarations: [AddEventPage],
})
export class AddEventPageModule {}
