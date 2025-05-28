import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-custom-toast',
  templateUrl: './custom-toast.component.html',
  styleUrls: ['./custom-toast.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CustomToastComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' | 'prompt' = 'info';

  iconMap: any = {
    success: 'checkmark-circle-outline',
    error: 'close-circle-outline',
    warning: 'alert-circle-outline',
    info: 'information-circle-outline',
    prompt: 'notifications-outline'
  };

  get icon() {
    return this.iconMap[this.type];
  }
}
