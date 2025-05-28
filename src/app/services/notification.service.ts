import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, of, Subject, switchMap } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';

export interface NotificationData {
  data: { title: string; message: string; type: string; };
  id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  //private apiUrl = 'http://localhost:8000/api/notifications';
  private apiUrl = environment.apiUrl;

  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    USER_TYPE: 'type_utilisateur'
  };


  public newNotification$ = new Subject<any>();
  private lastNotificationId: string | null = null;

  constructor(private http: HttpClient, private storage: Storage) {}

  startPolling() {
    setInterval(async () => {
      (await this.getNotifications()).subscribe((notifications: any[]) => {
        const unread = notifications.filter(n => !n.read_at);
        if (unread.length > 0 && unread[0].id !== this.lastNotificationId) {
          this.lastNotificationId = unread[0].id;
          this.newNotification$.next(unread[0]);
        }
      });
    }, 5000);
  }

  // getNotifications(): Observable<any[]> {
  //   return from(this.storage.get(this.STORAGE_KEYS.USER_TYPE)).pipe(
  //     switchMap(user => {
  //       if (user === 'ETUDIANT') {
  //         return this.http.get<any[]>(this.apiUrl);
  //       } else {
  //         return of([]);
  //       }
  //     })
  //   );
  // }

  getNotifications(): Observable<NotificationData[]> {
    return this.http.get<NotificationData[]>(`${this.apiUrl}notifications`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.apiUrl}notifications/read-all`, {});
  }

  // markAsRead(notificationId: string): Observable<any> {
  //   return this.http.post(`${this.apiUrl}notifications/${notificationId}/mark-as-read`, {});
  // }


}
