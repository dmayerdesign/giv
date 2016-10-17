import { Component, OnInit, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { UIHelper } from './services/app.service';
import { UserService } from './services/user.service';

@Component({
	selector: 'signup',
  templateUrl: 'app/signup.component.html'
})

export class SignupComponent implements OnInit {
	private formModel:{email: string, password: string, confirmPassword: string} = {email: null, password: null, confirmPassword: null};
  private user:any;
  private isLoggedIn:boolean;

	constructor(private http:Http,
							private router:Router,
							private userService:UserService,
							private ui:UIHelper) {

		if (localStorage['profile']) {
			this.router.navigate(['/']);
			this.ui.flash("You're already logged in!", "info");
		}
    // FOR DEMO MODE
    else this.router.navigate(['/']);
    this.ui.flash("Sorry—user accounts aren't available in the demo");
	}

  ngOnInit() {
    this.ui.setTitle("Sign up");
  }

  signup() {
    for (let field in this.formModel) {
    	if (this.formModel.hasOwnProperty(field) && !this.formModel[field]) return this.ui.flash("Oops! You need to fill out your " + field, "error");
    }
    if (this.formModel.email && this.formModel.password && this.formModel.confirmPassword) {
    	if (this.formModel.password !== this.formModel.confirmPassword) return this.ui.flash("Oops! Your passwords didn't match", "error");
    	
      this.http.post('/signup', this.formModel).map(res => res.json()).subscribe(data => {
        if (data.errmsg) {
          this.ui.flash(data.errmsg);
          return this.router.navigate(["/login"]);
        }
        this.http.post('/login', {email: this.formModel.email, password: this.formModel.password}).map(res => res.json()).subscribe(data => {
      		if (data.errmsg) {
            this.ui.flash(data.errmsg);
            return this.router.navigate(["/"]);
          }
          localStorage.setItem('profile', JSON.stringify(data));
          this.isLoggedIn = true;
          this.userService.confirmLogin(data);
          this.ui.flash("Welcome!", "success");
        	console.log(data);
          this.router.navigate(['/']);
        });
      });
    } else {
    	console.error("The form model was undefined.");
      this.ui.flash("Something went wrong", "error");
    }
  }
}