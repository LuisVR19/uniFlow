import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { ProfileService } from '../../services/profile.service';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  isSetup = false;
  loading = false;

  fullName = '';
  university = '';
  career = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly profileService: ProfileService,
    private readonly supabase: SupabaseService,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController,
    private readonly translate: TranslateService,
    readonly themeService: ThemeService,
    readonly languageService: LanguageService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isSetup = this.route.snapshot.queryParamMap.get('setup') === 'true';
    await this.loadProfile();
  }

  get initials(): string {
    return this.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';
  }

  async save(): Promise<void> {
    if (!this.fullName.trim()) {
      await this.showToast(this.translate.instant('profile.toast.nameRequired'), 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: this.translate.instant('common.loading.saving') });
    await loading.present();

    try {
      await this.profileService.update({
        full_name: this.fullName.trim(),
        university: this.university.trim() || undefined,
        career: this.career.trim() || undefined,
      });

      if (this.isSetup) {
        await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
      } else {
        await this.showToast(this.translate.instant('profile.toast.saved'), 'success');
      }
    } catch {
      await this.showToast(this.translate.instant('profile.toast.saveError'), 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('profile.logout.header'),
      message: this.translate.instant('profile.logout.message'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('auth.logout'),
          role: 'destructive',
          handler: () => { void this.logout(); },
        },
      ],
    });
    await alert.present();
  }

  private async logout(): Promise<void> {
    await this.supabase.signOut();
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  private async loadProfile(): Promise<void> {
    this.loading = true;
    try {
      const profile = await this.profileService.get();
      if (profile) {
        this.fullName = profile.full_name ?? '';
        this.university = profile.university ?? '';
        this.career = profile.career ?? '';
      }
    } catch {
      // new profile with no data yet — keep fields empty
    } finally {
      this.loading = false;
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await toast.present();
  }
}
