import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { SupabaseService } from '../../../services/supabase.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly translate: TranslateService,
    readonly themeService: ThemeService,
    readonly languageService: LanguageService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.form.value;

    const { error } = await this.supabase.signIn(email, password);
    this.loading = false;

    if (error) {
      this.errorMessage = this.resolveError(error.message);
      return;
    }

    this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  private resolveError(message: string): string {
    if (message.includes('Invalid login credentials')) {
      return this.translate.instant('auth.errors.invalidCredentials');
    }
    if (message.includes('Email not confirmed')) {
      return this.translate.instant('auth.errors.emailNotConfirmed');
    }
    return this.translate.instant('auth.errors.generic');
  }
}
