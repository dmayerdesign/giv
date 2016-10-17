import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ToastyService, ToastyConfig, ToastOptions, ToastData } from 'ng2-toasty';

@Injectable()
export class UIHelper {
  constructor (
        private title: Title,
        private toastyService:ToastyService,
        private toastyConfig:ToastyConfig) { }

  setTitle(newTitle: string) {
    this.title.setTitle( "GIV ♦ " + newTitle );
  }

  takeCount(children):number {
    let counter = ():number => {
      if (children && children.length) {
        return children.length;
      }
      else {
        window.clearInterval(counterFunc);
        return 0;
      }
    };
    let counterFunc = window.setInterval(counter, 100);
    
    return counter();
  }

  flash(message:string, type?:string) {
    var toastOptions:ToastOptions = {
      title: "",
      msg: message,
      showClose: true,
      timeout: 4000
    };
    type = type || "info";
    this.toastyService[type](toastOptions);
  }
}

@Injectable()
export class Utilities {
  existsLocally(localItem: string) {
  	if (typeof localStorage[localItem] === "undefined" || !localStorage[localItem] || !localStorage[localItem].length) {
  		return false;
  	} else {
  		return true;
  	}
  }

  contains(a,b) {
    if (a.indexOf(b) > -1)
      return true;
    else
      return false;
  }
}

export class InfoMessage {
  body: string;
  type: string = 'info';
}