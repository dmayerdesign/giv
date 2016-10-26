import { Component, OnInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { UserService } from './services/user.service';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
  selector: 'verify-email',
  templateUrl: 'app/verify-email.component.html'
})

export class VerifyEmailComponent implements OnInit {
  private token:string;
  private sub:Subscription;

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

        this.http.post("/verify-email/" + this.token, {}).map(res => res.json()).subscribe(
          user => {
            if (user.errmsg) {
              this.ui.flash("We couldn't verify your email", "error");
              return console.error(user.errmsg);
            }
            this.ui.flash("Thank you for verifying your email! Log in and enjoy", "success");
            this.router.navigate(['/login']);
          },
          err => {
            this.ui.flash("Oops! Something went wrong", "error");
            console.error(err);
          }
        );
      });
    }
  }

}