import { Component, OnInit } from '@angular/core';

interface Notification {
  id: string;
  type: 'presence' | 'absence' | 'justificatif' | 'system';
  title: string;
  message: string;
  expeditor: string;
  expanded: false;
  date: Date;
  read: boolean;
  urgent?: boolean;
  course?: {
    name: string;
    date: Date;
    professor: string;
  };
  attachment?: {
    url: string;
    type: 'pdf' | 'image';
  };
  status?: 'accepted' | 'refused' | 'pending'; // Pour justificatifs
  action?: {
    label: string;
    route: string;
  };
}

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
  notifications: Notification[] = [
    {
      id: "",
      type: 'system',
      title: "Test de fonctionnalité",
      message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
      expeditor: "Système",
      date: new Date(),
      read: true,
      expanded: false
    },
    {
      id: "",
      type: 'system',
      title: "Test de fonctionnalité",
      message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
      expeditor: "Système",
      date: new Date(),
      read: false,
      expanded: false
    },
    {
      id: "",
      type: 'system',
      title: "Test de fonctionnalité",
      message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
      expeditor: "Système",
      date: new Date(),
      read: false,
      expanded: false
    },
    {
      id: "",
      type: 'system',
      title: "Test de fonctionnalité",
      message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
      expeditor: "Système",
      date: new Date(),
      read: false,
      expanded: false
    },
    {
      id: "",
      type: 'system',
      title: "Test de fonctionnalité",
      message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
      expeditor: "Système",
      date: new Date(),
      read: false,
      expanded: false
    },
    {
      id: "",
      type: 'system',
      title: "Test de fonctionnalité",
      message: "Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
      expeditor: "Système",
      date: new Date(),
      read: false,
      expanded: false
    }
  ];
  filteredNotifications: Notification[] = [];
  selectedNotification: Notification = {
    id: "",
    type: 'system',
    title: "Test de fonctionnalité",
    message: " SELECTED NOTIFICATION Ceci est un test sur la fonctionnalité de notifications, ce message est inutilement long pour vérifier son comportement",
    expeditor: "Système",
    date: new Date(),
    read: true,
    expanded: false
  }

  constructor() { }

  ngOnInit() {
  }

  openModal(notif: any) {
    notif.read = true;
    //this.selectedNotification = notif;
    this.isModalOpen = true;
  }
  
  closeModal() {
    // this.selectedNotification.read = true;
    this.isModalOpen = false;
  }

  sortByDate(){}

  toggleMessageExpansion(type: Notification){}

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

  markAsRead(notif: Notification){
    notif.read = true;
  }

  markAllAsRead(){}

  deleteNotification(notif: Notification){}

  clearAll(){}

}
