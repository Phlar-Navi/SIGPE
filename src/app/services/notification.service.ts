import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, of, Subject, switchMap } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8000/api/notifications';
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

  getNotifications(): Observable<any[]> {
    return from(this.storage.get(this.STORAGE_KEYS.USER_TYPE)).pipe(
      switchMap(user => {
        if (user === 'ETUDIANT') {
          return this.http.get<any[]>(this.apiUrl);
        } else {
          return of([]);
        }
      })
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.post(`http://localhost:8000/api/notifications/${notificationId}/mark-as-read`, {});
  }


}
