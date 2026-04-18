import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { CoursesPageRoutingModule } from './courses-routing.module';
import { CoursesPage } from './courses.page';

@NgModule({
  imports: [CommonModule, IonicModule, TranslateModule, CoursesPageRoutingModule],
  declarations: [CoursesPage],
})
export class CoursesPageModule {}
