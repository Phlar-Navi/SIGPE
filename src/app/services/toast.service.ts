import { ApplicationRef, ComponentFactoryResolver, Injectable, Injector } from '@angular/core';
import { CustomToastComponent } from '../components/custom-toast/custom-toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' | 'prompt' = 'info') {
    const factory = this.componentFactoryResolver.resolveComponentFactory(CustomToastComponent);
    const componentRef = factory.create(this.injector);

    componentRef.instance.message = message;
    componentRef.instance.type = type;

    this.appRef.attachView(componentRef.hostView);

    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    // Remove after 3 seconds
    setTimeout(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }, 3000);
  }
}
