import { Component, OnInit } from '@angular/core';
import { NotificationData, NotificationService } from 'src/app/services/notification.service';
import { LoadingController } from '@ionic/angular';

interface Notification extends NotificationData {
  read: boolean;
  date: Date;
  expeditor: string;
  expanded: boolean;
  data: {
    title: string;
    message: string;
    type: 'info' | 'alert' | 'survey';
  };
}

// interface Notification {
//   id: string;
//   type: 'presence' | 'absence' | 'justificatif' | 'system';
//   title: string;
//   message: string;
//   expeditor: string;
//   expanded: false;
//   date: Date;
//   read: boolean;
//   urgent?: boolean;
//   course?: {
//     name: string;
//     date: Date;
//     professor: string;
//   };
//   attachment?: {
//     url: string;
//     type: 'pdf' | 'image';
//   };
//   status?: 'accepted' | 'refused' | 'pending'; // Pour justificatifs
//   action?: {
//     label: string;
//     route: string;
//   };
// }

@Component({
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
  standalone: false
})
export class NotificationPage implements OnInit {
  isMenuOpen = false;
  isSmallScreen = false;
  isModalOpen = false;
  
  filterType: string = "";
  filterStatus: string = "";
  // notifications: Notification[] = [
  //   {
  //     id: "",
  //     type: 'system',
  //     title: "Test de fonctionnalité",
  //     message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //     expeditor: "Système",
  //     date: new Date(),
  //     read: true,
  //     expanded: false
  //   },
  //   {
  //     id: "",
  //     type: 'system',
  //     title: "Test de fonctionnalité",
  //     message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //     expeditor: "Système",
  //     date: new Date(),
  //     read: false,
  //     expanded: false
  //   },
  //   {
  //     id: "",
  //     type: 'system',
  //     title: "Test de fonctionnalité",
  //     message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //     expeditor: "Système",
  //     date: new Date(),
  //     read: false,
  //     expanded: false
  //   },
  //   {
  //     id: "",
  //     type: 'system',
  //     title: "Test de fonctionnalité",
  //     message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //     expeditor: "Système",
  //     date: new Date(),
  //     read: false,
  //     expanded: false
  //   },
  //   {
  //     id: "",
  //     type: 'system',
  //     title: "Test de fonctionnalité",
  //     message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //     expeditor: "Système",
  //     date: new Date(),
  //     read: false,
  //     expanded: false
  //   },
  //   {
  //     id: "",
  //     type: 'system',
  //     title: "Test de fonctionnalité",
  //     message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //     expeditor: "Système",
  //     date: new Date(),
  //     read: false,
  //     expanded: false
  //   }
  // ];
  filteredNotifications: Notification[] = [];
  // selectedNotification: Notification = {
  //   id: "",
  //   type: 'system',
  //   title: "Test de fonctionnalité",
  //   message: " SELECTED NOTIFICATION Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
  //   expeditor: "Système",
  //   date: new Date(),
  //   read: true,
  //   expanded: false
  // }
  selectedNotification!: Notification;

  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService, 
    private loadingController: LoadingController) { }

  ngOnInit() {
    this.loadNotifications();
    //console.log(this.notifications[0]);
  }

  async loadNotifications() {
    const loading = await this.loadingController.create({
      message: 'Chargement...',
      spinner: 'bubbles',
      backdropDismiss: false
    });
    await loading.present();
    
    this.notificationService.getNotifications().subscribe(async (data) => {
      this.notifications = data.map((notif: NotificationData) => ({
        ...notif,
        read: !!notif.read_at,
        date: new Date(notif.created_at),
        expeditor: 'Administration',
        expanded: false,
        data: {
          title: notif.data?.title ?? '',
          message: notif.data?.message ?? '',
          type: this.parseNotificationType(notif.data?.type ?? 'info'),
        }
      }));
      
      await loading.dismiss();
      // Déplacé ici
      //console.log(this.notifications[0]);
    });
  }


  parseNotificationType(type: string): 'info' | 'alert' | 'survey' {
    if (type === 'alert' || type === 'survey') return type;
    return 'info';
  }


  openModal(notif: any) {
    this.selectedNotification = notif;
    this.isModalOpen = true;
  }
  
  closeModal() {
    // this.selectedNotification.read = true;
    this.markAsRead(this.selectedNotification);
    this.isModalOpen = false;
    this.selectedNotification.read = true;
  }

  sortByDate(){}

  toggleMessageExpansion(notification: Notification) {
    notification.expanded = !notification.expanded;
  }


  getNotificationTypeLabel(type: string): string {
    switch (type) {
      case 'justificatif': return 'Justificatif';
      case 'alerte': return 'Alerte';
      case 'info': return 'Information';
      default: return 'Notification';
    }
  }
  
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'justificatif': return 'document-text-outline';
      case 'alerte': return 'alert-circle-outline';
      case 'info': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  }
  
  getNotificationBadgeClass(type: string): string {
    switch (type) {
      case 'justificatif': return 'bg-blue-100 text-blue-700';
      case 'alerte': return 'bg-red-100 text-red-700';
      case 'info': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
  

  downloadAttachment(notif: Notification){}

  markAsRead(notif: Notification) {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        notif.read = true;
      });
    }
  }


  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.read = true);
    });
  }


  deleteNotification(notif: Notification){
    this.notificationService.deletenotif(notif.id).subscribe(() => {
      this.loadNotifications();
      console.log("Suppression effectuée !");
    });
  }

  clearAll(){
    this.notificationService.deleteall().subscribe(() => {
      this.loadNotifications();
      console.log("Suppressions effectuées !");
    });
  }

}
