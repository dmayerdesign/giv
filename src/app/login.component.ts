import { Component, OnInit, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { InfoMessage } from './services/app.service';
//import { FacebookService, FacebookLoginResponse, FacebookApiMethod } from 'ng2-facebook-sdk/dist';
import { UserService } from './services/user.service';

@Component({
	selector: 'login',
	templateUrl: 'app/login.component.html'
	//providers: [FacebookService]
})

export class LoginComponent implements OnInit {
	private infoMsg = new InfoMessage();
	private formModel = {email: null, password: null};
	private user:any;
  private isLoggedIn:boolean;

	constructor(private http:Http,
							//private fb:FacebookService,
							private router:Router,
							private userService:UserService) {

		if (localStorage['profile']) {
			this.router.navigate(['/']);
		}

		// this.fb.init({
  //     appId      : '146608639126993',
  //     cookie     : false,
  //     xfbml      : true,  // parse social plugins on this page
  //     version    : 'v2.5' // use graph api version 2.5
  //   });
	}

  ngOnInit() {
	  //this.checkLoginStatus();
  };


  login() {
    console.log(this.formModel);
    if (this.formModel && this.formModel.email && this.formModel.password) {
    	this.http.post('/login', this.formModel).subscribe(data => {
    		localStorage.setItem('profile', JSON.stringify(data));
        this.isLoggedIn = true;
        this.userService.confirmLogin(data);
      	console.log(data);
        this.router.navigate(['/']);
      });
    }
  }


  sendInfoMsg(body, type, time = 3000) {
		this.infoMsg.body = body;
		this.infoMsg.type = type;
		window.setTimeout(() => this.infoMsg.body = "", time);
	}

/**
* Facebook SDK implementation
*/

  // checkLoginStatus() {
  //   this.fb.getLoginStatus().then(response => {
  //     if (response.status === 'connected') {
	 //      console.log("Logged in with Facebook!");
	 //    } else if (response.status === 'not_authorized') {
	 //      console.log('Please log ' +
	 //        'into this app.');
	 //    } else {
	 //      console.log('Please log ' +
	 //        'into Facebook.');
	 //    }
  //   });
  // }

 //  getFacebookUser(loginRes:any) {
 //    console.log('Welcome!  Fetching your information.... ');
 //    this.fb.api('/me', FacebookApiMethod.get, {fields: 'id,email,first_name,last_name'}).then(res => {
 //      console.log(res);
 //      let loginParams = res;
 //      loginParams.token = {type: "facebook", accessToken: loginRes.authResponse.accessToken};
 //      this.http.post('/login', loginParams).subscribe(data => {
 //      	localStorage.setItem('profile', JSON.stringify(data));
 //      	this.userService.getLoggedInUser((err, data) => {
	// 				if (err) console.log(err);
	// 				else {
	// 					this.user = data;
 //            this.isLoggedIn = true;
 //            this.userService.confirmLogin(data);
 //            this.router.navigate(['/']);
	// 				}
	// 			});
 //      });
 //    });
 //  }

	// loginWithFacebook() {
 //    this.fb.login().then((res:FacebookLoginResponse) => {
 //    	console.log(res);
 //    	this.getFacebookUser(res);
 //    });
 //  }

 //  logoutOfFacebook() {
 //  	this.fb.logout().then(res => {
 //    	this.checkLoginStatus()
 //    });
 //  }

 //  statusChangeCallback(response:any):string {
 //    console.log('statusChangeCallback');
 //    console.log(response);

 //    if (response.status === 'connected') {
 //      console.log("Logged in with Facebook!");
 //    } else if (response.status === 'not_authorized') {
 //      console.log('Please log ' +
 //        'into this app.');
 //    } else {
 //      console.log('Please log ' +
 //        'into Facebook.');
 //    }
 //    return response.status;
 //  }

}