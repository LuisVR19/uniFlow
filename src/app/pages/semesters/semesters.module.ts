import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { SemestersPageRoutingModule } from './semesters-routing.module';
import { SemestersPage } from './semesters.page';

@NgModule({
  imports: [CommonModule, IonicModule, TranslateModule, SemestersPageRoutingModule],
  declarations: [SemestersPage],
})
export class SemestersPageModule {}
