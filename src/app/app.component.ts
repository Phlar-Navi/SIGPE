import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { MetadataService } from './services/metadata.service';
import { FirebaseMessagingService } from './services/firebase-messaging.service';
import { NotificationService } from './services/notification.service';
import { NotificationModalComponent } from './components/notification-modal/notification-modal.component';
import { SessionService } from './services/session.service';
import { BackgroundFetch } from '@transistorsoft/capacitor-background-fetch';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public showPrompt = false;
  notificationData: any = null;
  //showPresencePrompt = false;

    constructor(
    private platform: Platform,
    private authService: AuthService,
    private firebaseX: FirebaseX,
    private metadataService: MetadataService,
    private firebaseMessagingService: FirebaseMessagingService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController,
    private sessionService : SessionService,
    private loadingController: LoadingController
  ) {
    this.platform.ready().then(() => {
      this.firebaseMessagingService.initPush();
    }).catch(e => {
      console.log(e);
    });
    this.firebaseMessagingService.promptPresence$.subscribe(() => {
      this.showPrompt = true;
    });
  }

    handleAuth(method: 'fingerprint' | 'face') {
    this.showPrompt = false;
    if (method === 'fingerprint') {
      this.firebaseMessagingService.startFingerprintAuth();
    } else {
      this.firebaseMessagingService.startFacialRecognition();
    }
  }

  private initFCM() {
    this.firebaseMessagingService.requestPermissionAndGetToken();
    this.firebaseMessagingService.listenToMessages();
  }

  onPromptCancelled() {
    this.showPrompt = false;
  }

  ngOnInit() {
    this.startAutoSessionCheck();
    this.platform.ready().then(() => {
      this.initializeBackgroundFetch(); // ✅ Lancer ici une seule fois
    });

    // this.firebaseMessagingService.listenToMessages().subscribe((message: any) => {
    //   console.log('Message reçu via service :', message);
    //   this.notificationData = message; // par exemple, passer à ton composant
    //   this.showPrompt = true;
    // });


    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker enregistré :', registration);
        })
        .catch((err) => {
          console.error('❌ Erreur enregistrement Service Worker :', err);
        });
    }
    this.initFCM();
    console.log("AppComponent ngOnInit lancé");
    this.platform.ready().then(() => {
      console.log("Platform prête");

      this.authService.isAuthenticated().then((authenticated) => {
        console.log("Auth check :", authenticated);

        if (authenticated) {
          this.initializePushNotifications();
        } else {
          console.warn("Utilisateur non authentifié : notifications non initialisées.");
        }
      });
    });

    //this.notificationService.startPolling();

    this.notificationService.newNotification$.subscribe(async (notif) => {
      const modal = await this.modalCtrl.create({
        component: NotificationModalComponent,
        componentProps: { notif },
      });
      await modal.present();
    })
  }

  private initializePushNotifications() {
    this.firebaseX.getToken().then(token => {
      console.log('Device token Firebase:', token);

      // Appel à ton backend Laravel via le service Angular
      // this.metadataService.updateDeviceToken(token).subscribe({
      //   next: () => console.log('Token enregistré sur le backend.'),
      //   error: err => console.error('Erreur enregistrement token:', err)
      // });
    }).catch(err => {
      console.error('Erreur lors de la récupération du token:', err);
    });

    // Écoute des notifications
    this.firebaseX.onMessageReceived().subscribe(data => {
      console.log('📲 Notification reçue :', data);

      if (data.tap) {
        // Notification tapée → comportement spécial ?
        console.log("Notification ouverte par l'utilisateur.");
      } else {
        // Notification reçue en foreground
        console.log("Notification reçue en premier plan.");
      }
    });
  }

  startAutoSessionCheck() {
    setInterval(() => {
      this.checkAndStartSession();
    }, 1 * 60 * 1000); // toutes les 1 minute
  }

  checkAndStartSession() {
    this.sessionService.getUpcomingSession().subscribe(session => {
      if (session && session.statut === 'À venir') {
        this.sessionService.lancerSession(session.id).subscribe({
          next: res => {
            console.log('Session lancée avec succès', res);
          },
          error: err => {
            console.error('Erreur lors du lancement de la session', err);
          }
        });
      }
    });
  }

  initializeBackgroundFetch() {
    BackgroundFetch.configure({
      minimumFetchInterval: 1, // mettre au moins 15 min sur iOS, sinon ignoré (tant pis)
      stopOnTerminate: false,
      enableHeadless: true
    }, async (taskId) => {
      console.log('[BackgroundFetch] task: ', taskId);
      await this.checkAndStartSession();
      BackgroundFetch.finish(taskId);
    }, (error) => {
      console.warn('Background fetch failed to start', error);
    });
  }


}
