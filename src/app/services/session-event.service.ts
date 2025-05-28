// session-event.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionEventService {
  private refreshTriggerSubject = new BehaviorSubject<void>(undefined);
  refreshTrigger$ = this.refreshTriggerSubject.asObservable();

  triggerRefresh() {
    this.refreshTriggerSubject.next(); // Notifie tous les abonnés
  }

  private resetSelectedSubject = new BehaviorSubject<void>(undefined);
  resetSelected$ = this.resetSelectedSubject.asObservable();

  triggerResetSelected() {
    this.resetSelectedSubject.next();
  }
}
