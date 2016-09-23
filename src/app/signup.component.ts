import { Component, OnInit, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';
import { UserService } from './services/user.service';

@Component({
	selector: 'login'
, templateUrl: 'app/signup.component.html'
})

export class SignupComponent implements OnInit {
	private formModel:{email: string, password: string, confirmPassword: string};
	private user:any;
  private isLoggedIn:boolean;

	constructor(private http:Http,
							private router:Router,
							private userService:UserService,
							private flash:FlashMessagesService) {

		if (localStorage['profile']) {
			this.router.navigate(['/']);
			this.flash.show("You're already logged in!");
		}
	}

  ngOnInit() {
  	this.formModel = {email: null, password: null, confirmPassword: null};
  }

  signup() {
    for (let field in this.formModel) {
    	if (this.formModel.hasOwnProperty(field) && !this.formModel[field]) return this.flash.show("Oops! You need to fill out your " + field, {cssClass: "error"});
    }
    if (this.formModel.email && this.formModel.password && this.formModel.confirmPassword) {
    	if (this.formModel.password !== this.formModel.confirmPassword) return this.flash.show("Oops! Your passwords didn't match", {cssClass: "error"});
    	
      this.http.post('/signup', this.formModel).map(res => res.json()).subscribe(data => {
        if (data.errmsg) {
          this.flash.show("There's already an account with this email in our system.");
          return this.router.navigate(["/login"]);
        }
    		localStorage.setItem('profile', JSON.stringify(data));
        this.isLoggedIn = true;
        this.userService.confirmLogin(data);
        this.flash.show("Welcome!");
      	console.log(data);
        this.router.navigate(['/']);
      });
    } else {
    	console.error("The form model was undefined.");
      this.flash.show("Something went wrong", {cssClass: "error"});
    }
  }
}