import { Component, OnInit, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { UserService } from './services/user.service';

@Component({
	selector: 'app',
	templateUrl: 'app/app.component.html'
})

export class AppComponent implements OnInit {
	private isLoggedIn:boolean = false;
	private user:any;

	constructor(private http:Http,
							private userService:UserService,
							private zone:NgZone) {

		// Updates the component upon redirect from login
		userService.loginConfirmed$.subscribe(
      user => {
      	console.log("Login confirmed parent subscription");
      	console.log(user);
        this.user = user;
        this.isLoggedIn = true;
      });
	}

	ngOnInit() {
		this.userService.getLoggedInUser((err, data) => {
			if (err) console.log(err);
			else {
				this.user = data;
				this.isLoggedIn = true;
			}
		});
	}

	logOut() {
		localStorage.removeItem('profile');
		this.isLoggedIn = false;
	}
}
