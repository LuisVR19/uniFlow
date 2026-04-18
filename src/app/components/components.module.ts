import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { EventCardComponent } from './event-card/event-card.component';
import { ScheduleGridComponent } from './schedule-grid/schedule-grid.component';

@NgModule({
  declarations: [EventCardComponent, ScheduleGridComponent],
  imports: [CommonModule, DragDropModule, IonicModule, TranslateModule],
  exports: [EventCardComponent, ScheduleGridComponent],
})
export class ComponentsModule {}
