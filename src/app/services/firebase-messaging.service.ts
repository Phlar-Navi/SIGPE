import { Inject, Injectable, NgZone } from '@angular/core';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { MetadataService } from './metadata.service';
import { AuthService } from './auth.service';
import { CapacitorConfig } from '@capacitor/cli';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, 
  PushNotificationsPlugin, 
  PushNotificationToken,
  PushNotificationActionPerformed,
  Token, 
  PushNotificationSchema,
  ActionPerformed} from '@capacitor/push-notifications';
import { BehaviorSubject, Subject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { NotificationModalComponent } from '../components/notification-modal/notification-modal.component';
import { ToastService } from './toast.service';

import { SessionService } from './session.service';
import { SessionEventService } from './session-event.service';


export const FCM_TOKEN = 'push_notification_token'

@Injectable({
  providedIn: 'root',
})
export class FirebaseMessagingService {
  private messaging = getMessaging();
  private _redirect = new BehaviorSubject<any>(null);
  public promptPresence$ = new Subject<void>();

  private notificationDataSubject = new BehaviorSubject<any | null>(null);
  notificationData$ = new BehaviorSubject<any | null>(null);


  constructor(private metadataService: MetadataService, 
    private authService: AuthService,
    private storage: Storage,
    private http: HttpClient,
    private toastController: ToastController,
    private router: Router,
    private modalCtrl: ModalController,
    private toastService: ToastService,
    private sessionService: SessionService,
    private sessionEventService: SessionEventService,
    @Inject(NgZone) private zone: NgZone) {}

    setNotificationData(data: any) {
      this.notificationDataSubject.next(data);
    }

  requestPermissionAndGetToken() {
    return Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        return getToken(this.messaging, { vapidKey: 'BA196pYKrF1ukuz0mHkBRsA3tjxCUOuxNN01T66L1fTrEMRgP5GN3GAyZuQfjw8Q3pGa7FMaWXyL6D__uqGiPBU' })
          .then((token) => {
            console.log('Token FCM obtenu:', token);

            // Obtenir l'ID étudiant connecté
            this.authService.getUsersId().then(async (userId: number) => {
              const userType = await this.authService.getUsersType();
              console.log(userType);
              this.metadataService.updateDeviceToken(userId, token, userType).subscribe({
                next: () => console.log('Token envoyé au backend.'),
                error: (err) => console.error('Erreur envoi token:', err),
              });
            });

            return token;
          })
          .catch((err) => {
            console.error('Erreur récupération token FCM:', err);
          });
      } else {
        console.warn('Permission notifications refusée');
        return null;
      }
    });
  }

  // listenToMessages() {
  //   onMessage(this.messaging, async (payload) => {
  //     console.log('Notification reçue en foreground :', payload);
  //     // if (payload.notification) {
  //     //   this.presentToast(payload.notification.title + ': ' + payload.notification.body);
  //     // }

  //     if (payload.data){
  //       const notif = {
  //         title: payload.notification?.title,
  //         body: payload.notification?.body,
  //         redirect: payload.data['redirect'] || null,
  //       };

  //       const modal = await this.modalCtrl.create({
  //         component: NotificationModalComponent,
  //         componentProps: { notif },
  //       });
  //       await modal.present();
  //       }
  //   });
  // }

  // listenToMessages() {
  //   onMessage(this.messaging, async (payload) => {
  //     console.log('Notification reçue en foreground :', payload);

  //     const type = payload.data?.['type'] || 'info';
  //     const title = payload.notification?.title || 'Notification';
  //     const body = payload.notification?.body || 'Vous avez une nouvelle notification';

  //     if (payload.data?.['redirect'] === '/student-course') { // if (payload.data)
  //       // Déclencher le prompt
  //       this.promptPresence$.next();
  //     } else {
  //       this.toastService.show(`${title} : ${body}`, 'prompt');
  //     }
  //   });
  // }

  listenToMessages() {
    onMessage(this.messaging, async (payload) => {
      const data = payload.data;
      const message = payload.notification;
      const type = data?.['type'];
      const action = payload.data?.['action'];
      const context = payload.data?.['context'];

      console.log('Notification reçue en foreground :', payload);

      if (action === 'refresh_list') {
        this.sessionEventService.triggerRefresh_list();
      }

      if (action === 'refresh') {
        this.sessionEventService.triggerRefresh();
      }

      if (action === 'refresh' && context === 'justificatif') {
        this.zone.run(() => {
          this.sessionEventService.triggerRefresh();
        });
      }

      switch (type) {
        case 'modal':
          this.notificationData$.next(payload.data);
          this.promptPresence$.next(); // ou showPrompt(data)
          break;
        case 'alert':
          this.toastService.show(message?.['body'] || 'Alerte', 'error');
          break;
        case 'info':
          this.toastService.show(message?.['body'] || 'Information', 'info');
          break;
        case 'warning':
          this.toastService.show(message?.['body'] || 'Information', 'warning');
          break;
        case 'prompt':
          this.toastService.show(message?.['body'] || 'Information', 'prompt');
          break;
        // case 'survey':
        //   this.modalService.openSurvey(data);
        //   break;
        default:
          console.warn('Type de notification inconnu :', type);
          break;
      }
    });
  }


  public initPush(){
    if (Capacitor.getPlatform() !== 'web') {
     this.registerPush(); 
    }
  }

  private async registerPush() {
    try {
      await this.addListeners();
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') {
        throw new Error("L'utilisateur a refuse la permission");
      }
      await PushNotifications.register();
    } catch (e) {
      console.log(e);
    }
  }

  async getDeliveredNotification() {
    const notificationList = await PushNotifications.getDeliveredNotifications();
    console.log('Notifications delivrees', notificationList);
  }

  addListeners(){
    // PushNotifications.addListener(
    //   'registration',
    //   async(token: Token) => {
    //     console.log('Mon token: ', token);
    //     const fcm_token = (token?.value);
    //     let go = 1;
    //     const saved_token = JSON.parse((await this.storage.get(FCM_TOKEN)));
    //     if(saved_token) {
    //       if(fcm_token == saved_token) {
    //         console.log('Meme token');
    //         go = 0;
    //       } else {
    //         go = 2;
    //       }
    //     }
    //     if(go == 1) {
    //       this.storage.set(FCM_TOKEN, JSON.stringify(fcm_token));
    //     } else if(go == 2){
    //       const data = {
    //         expired_token: saved_token,
    //         refreshed_token: fcm_token
    //       };
    //       this.storage.set(FCM_TOKEN, fcm_token);
    //     }
    //   }
    // );

    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Mon token: ', token);
      const fcm_token = token?.value;
      let go = 1;
      const saved_token = JSON.parse(await this.storage.get(FCM_TOKEN));
      
      if (saved_token) {
        if (fcm_token === saved_token) {
          console.log('Meme token');
          go = 0;
        } else {
          go = 2;
        }
      }

      if (go === 1 || go === 2) {
        await this.storage.set(FCM_TOKEN, JSON.stringify(fcm_token));

        this.http.post('/api/save-fcm-token', { fcm_token }).subscribe({
          next: () => console.log('Token envoyé à Laravel'),
          error: (err) => console.error('Erreur envoi token:', err),
        });
      }
    });
    PushNotifications.addListener('registrationError', (error: any) => {
      console.log('Error: ' + JSON.stringify(error));
    });
    PushNotifications.addListener('pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        console.log('Push recue: ' + JSON.stringify(notification));
        this.presentToast(notification.title + ' : ' + notification.body);
        const data = notification?.data;
        if(data?.redirect) this._redirect.next(data?.redirect);
      }
    );
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async (notification:ActionPerformed) => {
        const data = notification.notification.data;
        console.log('Action effectuée: ' + JSON.stringify(notification.notification));
        console.log('Donnée Pushée: ', data);
        if(data?.redirect) this._redirect.next(data?.redirect);
      }
    );

    this._redirect.subscribe((target) => {
      if (target) {
        this.router.navigateByUrl(target);
      }
    });
  }

  async removeFcmToken(){
    try {
      // const saved_token = JSON.parse((await this.storage.get(FCM_TOKEN)).value);
      // this.storage.remove(saved_token);
      const saved_token = JSON.parse(await this.storage.get(FCM_TOKEN));
      await this.storage.remove(FCM_TOKEN);
    } catch(e) {
      console.log(e);
      throw(e);
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
    });
    toast.present();
  }

  async startFingerprintAuth() {
    // const { BiometricAuth } = await import('@capacitor-fingerprint-auth');
    // const available = await BiometricAuth.isAvailable();
    // if (available.available) {
    //   const result = await BiometricAuth.verify();
    //   console.log('Fingerprint Auth Result', result);
    //   // TODO: envoyer confirmation au backend ou router
    // }
  }

  async startFacialRecognition() {
    // À adapter quand tu auras ton API
    const result = await this.http.post('https://tonapi.com/facial-auth', {}).toPromise();
    console.log('Résultat reconnaissance faciale :', result);
  }


}