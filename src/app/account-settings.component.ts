import { Component, OnInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { UserService } from './services/user.service';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'account-settings',
	templateUrl: 'app/account-settings.component.html',
	styleUrls: ['app/manage-org-page.component.css', 'app/form-field.component.css', 'app/account-settings.component.css']
})

export class AccountSettingsComponent implements OnInit {
	private user:any;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private progress:number = 0;
	private adminToken:string;

	/** Fields to edit **/
	private model = {
    _id: null,
    email: null,
    name: null,
    username: null,
    gender: null,
    avatar: null
  };

	private passwords = {
    current: null,
    password: null,
    confirm: null
  };

	/** Changed **/
	private changed:boolean = false;
	private saving:boolean = false;
	private checked = {};

	/** Username validation **/
	private usernameIsValid:boolean = true;

	/** Upload options **/
  private avatarUploadOptions:Object;

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
		this.ui.setTitle("Your account");
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			this.user = user;
			this.http.get("/adminToken").map(res => res.json()).subscribe(
				data => {
					this.adminToken = data;
				},
				err => {
					console.error(err);
				}
			);

			this.isLoaded = true;

      this.model._id = this.user._id;
      this.model.email = this.user.email;
			this.model.name = this.user.name;
			this.model.username = this.user.username;
			this.model.gender = this.user.gender;
			this.model.avatar = this.user.avatar;

			this.avatarUploadOptions = {
			  url: '/account/upload/avatar/' + this.user._id,
			  filterExtensions: true,
			  calculateSpeed: true,
			  allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
			};

		});
	}

  handleUpload(user):void {
  	this.user = user;
  	this.stillWorking = false;
  	console.log("User", user);
  }

  checkForUniqueUsername($event) {
    if (!this.model.username || typeof this.model.username === "undefined") return;

  	this.http.get("/user/u/" + this.model.username).map(res => res.json()).subscribe(data => {
  		if (data) {
  			this.usernameIsValid = false;
  			this.ui.flash("Sorry, that username is taken", "error");
  		}
  		else this.usernameIsValid = true;
  	});
  }

  savePassword() {
  	if (!this.passwords.current || !this.passwords.password || !this.passwords.confirm) {
  		return this.ui.flash("Enter your current password, then type your new password twice", "info");
  	}
  	if (this.passwords.password !== this.passwords.confirm) {
  		return this.ui.flash("New passwords don't match", "error");
  	}
  	this.http.post("/account/password", {
  		_id: this.user._id,
  		currentPassword: this.passwords.current,
  		password: this.passwords.password,
  		confirmPassword: this.passwords.confirm
  	}).map(res => res.json()).subscribe(user => {
  		if (user.errmsg) return this.ui.flash(user.errmsg, "error");
      this.ui.flash("Your password was changed successfully", "success");
  		this.user = user;
  		console.log(user);
  	}, err => {
  		this.ui.flash("Something went wrong. Try again", "error");
  		console.error(err);
  	});
  }

  updatePasswords(key:string, value:any) {
    this.passwords[key] = value;
  }

  updateModel(key:string, value:any) {
  	this.model[key] = value;
  }

  save():void {
  	if (this.model.username && this.model.username.length) {
  		let usernameMatch = this.model.username.match(/[^a-zA-Z0-9\-_]/);
  		if (usernameMatch) {
  			return this.ui.flash("Your username can't contain spaces or special characters", "error");
  		} else {
  			this.model.username = this.model.username.toLowerCase();
  		}
  	}

  	this.saving = true;
  	this.http.post("/account/profile", this.model).map(res => res.json()).subscribe(res => {
  		console.log(res);
  		if (res.errmsg) {
  			this.ui.flash("Save failed", "error");
  			this.saving = false;
  			return;
  		}
  		this.user = res;
  		this.saving = false;
  		this.changed = false;
  		this.ui.flash("Saved", "success");
  		console.log(res);
  	});
  }

  deleteAccount(id) {
  	if (window.confirm("Are you sure you want to delete your account? This can't be undone.")) {
  		if (window.confirm("Sure you're sure?")) {
		  	let userId = id || this.user._id;
		  	this.http.delete('/user/' + userId).map(res => res.json()).subscribe(data => {
		  		if (data && data.success) {
		  			this.router.navigate(['']);
		  			return this.ui.flash("User was deleted successfully", "error");
		  		}
		  	});
		  }
	  }
  }

  changeHandler(key:string, event) {
  	if (event.target.value)
  		this.changed = true;
  	else
  		this.changed = false;
  }

  userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

}