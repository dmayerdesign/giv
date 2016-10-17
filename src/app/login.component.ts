import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from './services/user.service';
import { Subscription } from 'rxjs/Subscription';
import { UIHelper } from './services/app.service';
//import { FacebookService, FacebookLoginResponse, FacebookApiMethod } from 'ng2-facebook-sdk/dist';

@Component({
	selector: 'login'
, templateUrl: 'app/login.component.html'
//, providers: [FacebookService]
})

export class LoginComponent implements OnInit {
	private formModel = {email: null, password: null};
	private user:any;
  private isLoggedIn:boolean;
  private querySub:Subscription;

	constructor(//private fb:FacebookService,
							private http:Http,
							private router:Router,
              private route:ActivatedRoute,
							private userService:UserService,
							private ui:UIHelper
              ) {

		if (localStorage['profile']) {
			this.router.navigate(['/']);
		}

    // FOR DEMO MODE
    // else this.router.navigate(['/']);
    // this.ui.flash("Sorry—user accounts aren't available in the demo");

		// this.fb.init({
  //     appId      : '146608639126993',
  //     cookie     : false,
  //     xfbml      : true,  // parse social plugins on this page
  //     version    : 'v2.5' // use graph api version 2.5
  //   });
	}

  ngOnInit() {
	  //this.checkLoginStatus();
    this.ui.setTitle("Login");
    this.getQueryParams((data) => console.log(data));
  }

  ngOnDestroy() {
    this.querySub.unsubscribe();
  }

  getQueryParams(next) {
    this.querySub = this.route.queryParams.subscribe(data => next(data));
  }

  login() {
    for (let field in this.formModel) {
    	if (this.formModel.hasOwnProperty(field) && !this.formModel[field]) return this.ui.flash("Oops! You need to enter your " + field, "error");
    }
    if (this.formModel.email && this.formModel.password) {
    	this.http.post('/login', this.formModel).map(res => res.json()).subscribe(data => {
        console.log(data);
        if (!data["_id"]) return this.ui.flash("Login failed", "error");
    		localStorage.setItem('profile', JSON.stringify(data));
        this.isLoggedIn = true;
        this.userService.confirmLogin(data);
      	console.log(data);
        this.getQueryParams(params => {
          if (params['redirect']) {
            console.log(decodeURI(params['redirect']));
            window.location.href = decodeURI(params['redirect']);
          } else {
            this.router.navigate(['/']);
          }
        }); 
      }, error => {
        console.log(error);
        this.ui.flash("That account doesn't exist", "error");
      });
    } else {
    	console.error("The form model was undefined.");
    }
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