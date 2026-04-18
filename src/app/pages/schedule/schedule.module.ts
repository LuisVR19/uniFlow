import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '../../components/components.module';
import { SchedulePageRoutingModule } from './schedule-routing.module';
import { SchedulePage } from './schedule.page';

@NgModule({
  imports: [CommonModule, IonicModule, ComponentsModule, SchedulePageRoutingModule, TranslateModule],
  declarations: [SchedulePage],
})
export class SchedulePageModule {}
