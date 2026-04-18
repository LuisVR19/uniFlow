import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { TasksPageRoutingModule } from './tasks-routing.module';
import { TasksPage } from './tasks.page';

@NgModule({
  imports: [CommonModule, IonicModule, TranslateModule, TasksPageRoutingModule],
  declarations: [TasksPage],
})
export class TasksPageModule {}
