import { Component, OnInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { UserService } from './services/user.service';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'reset-password',
	templateUrl: 'app/reset-password.component.html',
	styleUrls: ['app/manage-org-page.component.css', 'app/form-field.component.css', 'app/account-settings.component.css']
})

export class ResetPasswordComponent implements OnInit {
	private token:string;
  private sub:Subscription;
  private isLoaded:boolean = false;

	private passwords = {
    password: null,
    confirm: null
  };

	constructor(
				private router:Router,
				private route:ActivatedRoute,
				private userService:UserService,
				private ui:UIHelper,
				private utilities:Utilities,
				private zone:NgZone,
				private http:Http,
				private categoryService:Categories) { }

	ngOnInit() {
    if (this.route.params) {
      this.sub = this.route.params.subscribe(params => {
        this.token = params['token'];
        this.isLoaded = true;
      });
    }
	}

  savePassword() {
  	if (!this.passwords.password || !this.passwords.confirm) {
  		return this.ui.flash("Type your new password twice", "info");
  	}
  	if (this.passwords.password !== this.passwords.confirm) {
  		return this.ui.flash("Passwords don't match", "error");
  	}
  	this.http.post("/reset/" + this.token, {
  		password: this.passwords.password,
  		confirmPassword: this.passwords.confirm
  	}).map(res => res.json()).subscribe(user => {
  		if (user.errmsg) return this.ui.flash(user.errmsg, "error");
      this.ui.flash("Your password was updated successfully", "success");
  		console.log(user);
  	}, err => {
  		this.ui.flash("Something went wrong. Try again", "error");
  		console.error(err);
  	});
  }

  updatePasswords(key:string, value:any) {
    this.passwords[key] = value;
  }

}