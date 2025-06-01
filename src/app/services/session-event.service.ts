// session-event.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionEventService {
  private refreshTriggerSubject = new BehaviorSubject<void>(undefined);
  refreshTrigger$ = this.refreshTriggerSubject.asObservable();

  private refreshTriggerSubject_list = new BehaviorSubject<void>(undefined);
  refreshTrigger_list$ = this.refreshTriggerSubject_list.asObservable();

  private resetSelectedSubject = new BehaviorSubject<void>(undefined);
  resetSelected$ = this.resetSelectedSubject.asObservable();

  triggerRefresh() {
    this.refreshTriggerSubject.next(); // Notifie tous les abonnés
  }

  triggerRefresh_list() {
    this.refreshTriggerSubject_list.next(); // Notifie tous les abonnés de la liste de présence
  }

  triggerResetSelected() {
    this.resetSelectedSubject.next();
  }
}
