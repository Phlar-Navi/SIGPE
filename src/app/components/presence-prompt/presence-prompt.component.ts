import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { SessionService } from 'src/app/services/session.service';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-presence-prompt',
  templateUrl: './presence-prompt.component.html',
  styleUrls: ['./presence-prompt.component.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule],
})
export class PresencePromptComponent {
  @Output() validated = new EventEmitter<'fingerprint' | 'face'>();
  @Input() notification: any;
  @Output() cancelled = new EventEmitter<void>();


  private sessionService = inject(SessionService);
  private authService = inject(AuthService);

  async useFingerprint() {
    await this.verifyBiometric('fingerprint');
  }

  async useFacialRecognition() {
    await this.verifyBiometric('face');
  }

  private async verifyBiometric(type: 'fingerprint' | 'face') {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        alert("Biométrie non disponible sur cet appareil.");
        return;
      }

      const isFace = result.biometryType === BiometryType.FACE_ID;
      if ((type === 'face' && !isFace) || (type === 'fingerprint' && isFace)) {
        alert(`Ce type de vérification (${type}) n'est pas supporté sur cet appareil.`);
        return;
      }

      const verified = await NativeBiometric.verifyIdentity({
        reason: "Confirme ton identité pour valider ta présence",
        title: "Vérification biométrique",
        subtitle: type === 'face' ? "Reconnaissance faciale" : "Empreinte digitale",
        description: "Authentifie-toi pour confirmer ta présence.",
      }).then(() => true).catch(() => false);

      if (!verified) {
        alert("Échec de la vérification biométrique.");
        return;
      }

      // 🟢 Appel backend : marquer la présence
      const sessionId = this.notification?.data?.session_id;
      const etudiantId = await this.authService.getUsersId();

      if (!sessionId || !etudiantId) {
        alert("Informations manquantes pour confirmer la présence.");
        return;
      }

      this.sessionService.markPresent(etudiantId, sessionId).subscribe({
        next: () => {
          alert("Présence confirmée !");
          this.validated.emit(type);
        },
        error: (err) => {
          console.error(err);
          alert("Erreur lors de l'enregistrement de la présence.");
        }
      });

    } catch (error) {
      console.error("Erreur biométrique:", error);
      alert("Malhereusement, cet appareil ne prend pas en charge ce type de reconnaissance biométrique...");
    }
  }

  cancel() {
    this.cancelled.emit();
  }

}
