import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

@Injectable()
/** Dummy version of an authenticated user service */
export class UserService {
	private user:any;

	constructor(private http:Http) { }

  getLoggedInUser(next) {
  	if (localStorage['profile']
			&& localStorage['profile'].length
			&& JSON.parse(localStorage['profile'])
			&& JSON.parse(localStorage['profile'])._body) {

			this.user = JSON.parse(JSON.parse(localStorage['profile'])._body);
			this.http.get('/user/' + this.user._id).map(res => res.json()).subscribe(data => {
				if (data) {
					next(data);
				} else {
					console.log("No data received");
				}
			});
		}
  }
}