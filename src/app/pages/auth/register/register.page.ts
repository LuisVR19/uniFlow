import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { SupabaseService } from '../../../services/supabase.service';
import { ThemeService } from '../../../services/theme.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly translate: TranslateService,
    readonly themeService: ThemeService,
    readonly languageService: LanguageService,
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatch },
    );
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { email, password } = this.form.value;

    const { error, data } = await this.supabase.signUp(email, password);
    this.loading = false;

    if (error) {
      this.errorMessage = this.resolveError(error.message);
      return;
    }

    if (data.session) {
      this.router.navigateByUrl('/profile?setup=true', { replaceUrl: true });
    } else {
      this.successMessage = this.translate.instant('auth.register.confirmEmail');
    }
  }

  private resolveError(message: string): string {
    if (message.includes('already registered') || message.includes('User already registered')) {
      return this.translate.instant('auth.errors.emailInUse');
    }
    if (message.includes('Password should be')) {
      return this.translate.instant('auth.errors.passwordWeak');
    }
    return this.translate.instant('auth.errors.generic');
  }
}
