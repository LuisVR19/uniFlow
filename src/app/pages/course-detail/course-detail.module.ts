import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { CourseDetailPageRoutingModule } from './course-detail-routing.module';
import { CourseDetailPage } from './course-detail.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule, CourseDetailPageRoutingModule],
  declarations: [CourseDetailPage],
})
export class CourseDetailPageModule {}
