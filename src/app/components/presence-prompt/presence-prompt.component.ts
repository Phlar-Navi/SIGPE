import { Component, Output, EventEmitter, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { SessionService } from 'src/app/services/session.service';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { LocationService } from 'src/app/services/location.service';
import { AlertController } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';
import { LoadingController } from '@ionic/angular';
import { FirebaseMessagingService } from 'src/app/services/firebase-messaging.service';

@Component({
  selector: 'app-presence-prompt',
  templateUrl: './presence-prompt.component.html',
  styleUrls: ['./presence-prompt.component.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule],
})
export class PresencePromptComponent implements OnInit{
  @Output() validated = new EventEmitter<'fingerprint' | 'face'>();
  @Input() notification: any;
  @Output() cancelled = new EventEmitter<void>();
  etudiantId!: number;
  sessionNotificationData: any;

  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);
  private alertController = inject(AlertController);
  private toastService = inject(ToastService);
  private loadingController = inject(LoadingController);
  private firebaseService = inject(FirebaseMessagingService);

  // ngOnInit(): void {
  //   if (!this.notification) {
  //     // fallback si rien n'est passé par le parent
  //     this.firebaseService.notificationData$.subscribe((data) => {
  //       if (data) { this.sessionNotificationData = data; this.notification = data; }
  //     });
  //   } else {
  //     this.sessionNotificationData = this.notification;
  //   }
  // }
  ngOnInit(): void {
    this.firebaseService.notificationData$.subscribe((data) => {
      if (data) {
        this.sessionNotificationData = data;
        this.notification = data;
      }
    });
  }

  async useFingerprint() {
    await this.verifyBiometric('fingerprint');
  }

  async useFacialRecognition() {
    await this.verifyBiometric('face');
  }

  async requestLocationAndProceed(biometricType: 'fingerprint' | 'face') {
    const alert = await this.alertController.create({
      header: 'Partager votre position ?',
      message: 'Nous avons besoin de votre localisation pour continuer.',
      buttons: [
        {
          text: 'Refuser',
          role: 'cancel',
          handler: async () => {
            await this.toastService.show('Vous devez autoriser la localisation pour continuer.', 'error');
          }
        },
        {
          text: 'Autoriser',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Vérification de la position...',
              spinner: 'bubbles',
              backdropDismiss: false
            });
            await loading.present();

            try {
              const etudiantId = await this.authService.getUserId();
              const position = await this.locationService.getCurrentLocation();

              if (!position) {
                await loading.dismiss();
                await this.toastService.show('Position introuvable.', 'error');
                return;
              }
              const salleCoords = this.notification?.data || this.sessionNotificationData;
              //const salleCoords = this.notification?.data;
              if (
                !salleCoords ||
                !salleCoords.latitude ||
                !salleCoords.longitude ||
                !salleCoords.rayon // ici c'est `rayon`, pas `rayon_metres`
              ) {
                await loading.dismiss();
                await this.toastService.show('Coordonnées de salle manquantes.', 'error');
                return;
              }
              const isInRange = await this.locationService.isInSallePerimetre(
                  position.latitude,
                  position.longitude,
                  {
                      latitude: parseFloat(salleCoords.latitude),
                      longitude: parseFloat(salleCoords.longitude),
                      rayon_metres: parseFloat(salleCoords.rayon || salleCoords.rayon_metres) // Gère les 2 cas
                  }
              );
              if (!isInRange) {
                await loading.dismiss();
                await this.toastService.show('Vous êtes hors du périmètre autorisé.', 'error');
                return;
              }

              await loading.dismiss();
              await this.verifyBiometric(biometricType);

            } catch (err) {
              await loading.dismiss();
              console.error('Erreur vérification localisation :', err);
              await this.toastService.show('Erreur de localisation.', 'error');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // async requestLocationAndProceed(biometricType: 'fingerprint' | 'face') {
  //   console.log(this.notification);
  //   const alert = await this.alertController.create({
  //     header: 'Partager votre position ?',
  //     message: 'Nous avons besoin de votre localisation pour continuer.',
  //     buttons: [
  //       {
  //         text: 'Refuser',
  //         role: 'cancel',
  //         handler: async () => {
  //           await this.toastService.show('Vous devez autoriser la localisation pour continuer.', 'error');
  //         }
  //       },
  //       {
  //         text: 'Autoriser',
  //         handler: async () => {
  //           const loading = await this.loadingController.create({
  //             message: 'erification de la position...',
  //             spinner: 'bubbles',
  //             backdropDismiss: false
  //           });
  //           await loading.present();

  //           const etudiantId = await this.authService.getUserId();

  //           if (etudiantId) {
  //             const success = await this.locationService.sendLocationToBackend(etudiantId);
  //             if (success) {
  //               await loading.dismiss();
  //               await this.verifyBiometric(biometricType);
  //             } else {
  //               await loading.dismiss();
  //             }
  //           }
  //         }
  //       }
  //     ]
  //   });

  //   await alert.present();
  // }

  private async verifyBiometric(type: 'fingerprint' | 'face') {
    try {
      // Vérification biométrique existante
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

      // Récupération des données nécessaires
      const sessionId = this.notification?.data?.session_id;
      const etudiantId = await this.authService.getUsersId();
      const heureDebut = this.notification?.data?.time; // Format: "2025-06-03 05:08:00"

      if (!sessionId || !etudiantId || !heureDebut) {
        alert("Informations manquantes pour confirmer la présence.");
        return;
      }

      // Calcul du retard
      const now = new Date();
      const debutSession = new Date(heureDebut);
      const retardMinutes = (now.getTime() - debutSession.getTime()) / (1000 * 60);

      // Détermination du statut
      const statut = retardMinutes > 5 ? 'en retard' : 'présent';

      // Appel backend avec le statut approprié
      this.sessionService.changerStatutPresence(sessionId, etudiantId, statut).subscribe({
        next: () => {
          const message = statut === 'en retard' 
            ? `Présence enregistrée (retard de ${Math.round(retardMinutes)} minutes)` 
            : "Présence confirmée à l'heure !";
          alert(message);
          this.validated.emit(type);
        },
        error: (err) => {
          console.error(err);
          alert("Erreur lors de l'enregistrement de la présence.");
        }
      });

    } catch (error) {
      console.error("Erreur biométrique:", error);
      alert("Malheureusement, cet appareil ne prend pas en charge ce type de reconnaissance biométrique...");
    }
  }

  // private async verifyBiometric(type: 'fingerprint' | 'face') {
  //   try {
  //     const result = await NativeBiometric.isAvailable();
  //     if (!result.isAvailable) {
  //       alert("Biométrie non disponible sur cet appareil.");
  //       return;
  //     }

  //     const isFace = result.biometryType === BiometryType.FACE_ID;
  //     if ((type === 'face' && !isFace) || (type === 'fingerprint' && isFace)) {
  //       alert(`Ce type de vérification (${type}) n'est pas supporté sur cet appareil.`);
  //       return;
  //     }

  //     const verified = await NativeBiometric.verifyIdentity({
  //       reason: "Confirme ton identité pour valider ta présence",
  //       title: "Vérification biométrique",
  //       subtitle: type === 'face' ? "Reconnaissance faciale" : "Empreinte digitale",
  //       description: "Authentifie-toi pour confirmer ta présence.",
  //     }).then(() => true).catch(() => false);

  //     if (!verified) {
  //       alert("Échec de la vérification biométrique.");
  //       return;
  //     }

  //     // 🟢 Appel backend : marquer la présence
  //     const sessionId = this.notification?.data?.session_id;
  //     const etudiantId = await this.authService.getUsersId();

  //     if (!sessionId || !etudiantId) {
  //       alert("Informations manquantes pour confirmer la présence.");
  //       return;
  //     }

  //     this.sessionService.changerStatutPresence(sessionId, etudiantId, 'présent').subscribe({
  //       next: () => {
  //         alert("Présence confirmée !");
  //         this.validated.emit(type);
  //       },
  //       error: (err) => {
  //         console.error(err);
  //         alert("Erreur lors de l'enregistrement de la présence.");
  //       }
  //     });

  //   } catch (error) {
  //     console.error("Erreur biométrique:", error);
  //     alert("Malhereusement, cet appareil ne prend pas en charge ce type de reconnaissance biométrique...");
  //   }
  // }

  cancel() {
    this.cancelled.emit();
  }

}
