import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Subject } from 'rxjs/subject';

@Injectable()
/** Dummy version of an authenticated user service */
export class UserService {
	private user:any;

	// Observable string sources
  //private loginAnnouncedSource = new Subject<string>();
  private loginConfirmedSource = new Subject<string>();
  // Observable string streams
  //loginAnnounced$ = this.loginAnnouncedSource.asObservable();
  loginConfirmed$ = this.loginConfirmedSource.asObservable();

	constructor(private http:Http) { }

  getLoggedInUser(next) {
  	if (localStorage['profile']
			&& localStorage['profile'].length
			&& JSON.parse(localStorage['profile'])
			&& JSON.parse(localStorage['profile'])._body) {
  		this.user = JSON.parse(JSON.parse(localStorage['profile'])._body);
		}
  	else if (localStorage['profile']
			&& localStorage['profile'].length) {
			this.user = JSON.parse(localStorage['profile']);
		}
		else return next("No user was logged in");
			
		this.http.get('/user/' + this.user._id).map(res => res.json()).subscribe(data => {
			if (data) {
				next(null, data);
			} else {
				next("The logged in user couldn't be found");
			}
		});
  }

  // Service message commands
  // announceLogin(user) {
  //   this.loginAnnouncedSource.next(user);
  // }
  confirmLogin(user) {
  	console.log("Confirming login");
  	console.log(user);
    this.loginConfirmedSource.next(user);
  }

}