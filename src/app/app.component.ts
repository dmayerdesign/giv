import { Component, OnInit, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from './services/user.service';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
	selector: 'app',
	templateUrl: 'app/app.component.html'
})

export class AppComponent implements OnInit {
	private isLoggedIn:boolean = false;
	private user:any;
	private location:string;

	constructor(private http:Http,
							private userService:UserService,
							private flash:FlashMessagesService,
							private zone:NgZone,
							private router:Router,
							private route:ActivatedRoute) {

		// Updates the component upon redirect from login
		userService.loginConfirmed$.subscribe(user => {
    	console.log("Login confirmed in app component");
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

		localStorage.setItem("construction", "sohcahtoa");
	}

	ngDoCheck() {
		this.location = encodeURI(window.location.href);
	}

	logIn() {
		this.router.navigate(['/login'], { queryParams: { redirect: this.location } });
	}

	logOut() {
		localStorage.removeItem('profile');
		this.isLoggedIn = false;
		this.flash.show("Bye!");
		this.router.navigate(['/']);
	}
}
