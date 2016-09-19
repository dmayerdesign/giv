import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Http } from '@angular/http';
import { UserService } from './services/user.service';

@Component({
	selector: 'app',
	templateUrl: 'app/app.component.html'
})

export class AppComponent implements OnInit {
	private isLoggedIn:boolean = false;
	private user:any;

	constructor(private router:Router,
							private http:Http,
							private userService:UserService) {
		router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				console.log(event);
				this.userService.getLoggedInUser((err, data) => {
					if (err) console.log(err);
					else {
						this.user = data;
						this.isLoggedIn = true;
					}
				});
			}
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
