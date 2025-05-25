import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { NotificationService } from 'src/app/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class NotificationModalComponent  implements OnInit {
  @Input() notif: any;
  showNotificationModal: boolean = true;

  constructor(private modalCtrl: ModalController, private notificationService: NotificationService, private router: Router) {}

  async onConfirm() {
    console.log('Notification fermée');

    await this.modalCtrl.dismiss({
      dismissed: true
    });
  }

  dismiss() {
    this.notificationService.markAsRead(this.notif.id).subscribe(() => {
        console.log('Notification marquée comme lue');
        this.modalCtrl.dismiss();
    });
    this.modalCtrl.dismiss();
  }

  redirectToSession(){}

  ngOnInit() {}

  goToRedirect() {
    this.modalCtrl.dismiss();
    if (this.notif.redirect) {
      this.router.navigateByUrl(this.notif.redirect);
    }
  }

}
