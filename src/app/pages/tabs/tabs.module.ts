import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { TabsPageRoutingModule } from './tabs-routing.module';
import { TabsPage } from './tabs.page';

@NgModule({
  imports: [CommonModule, IonicModule, TabsPageRoutingModule, TranslateModule],
  declarations: [TabsPage],
})
export class TabsPageModule {}
