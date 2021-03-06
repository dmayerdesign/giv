import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';
import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'single-org',
	templateUrl: 'app/single-org.component.html',
	styleUrls: [ 'app/org.styles.css', 'app/single-org.component.css', 'app/form-field.component.css' ]
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB

export class SingleOrgComponent implements OnInit {
	private org;
	private user;
	private sub:Subscription;
	private isLoaded:boolean = false;
  private videoLink:any;
  private videoIsExpanded:boolean;
  private videoBg:string;
  private showOptionsMenu:boolean;
  private adminToken:string;
  private ratingOrg:boolean;
  private orgRating:any = null;
  private ratings = [0,1,2,3,4,5,6,7,8,9,10];
  private lowRatings = [1,2,3,4,5];
  private highRatings = [6,7,8,9,10];
  private selected = {};

	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private http: Http,
				private orgService: OrgService,
				private userService: UserService,
				private ui: UIHelper,
				private utilities: Utilities,
				private zone: NgZone,
        private sanitizer: DomSanitizer) { }

	ngOnInit() {
		this.sub = this.route.params.subscribe(params => {
			let id = params['id'];
			let slug = params['slug'];

			this.orgService.loadOrg({id: id, slug: slug}).subscribe(
				data => {
					if (!data || !data._id) {
						this.ui.flash("This page doesn't exist", "error");
						return this.router.navigate([''], { queryParams: {"404": true}});
					}
					window.scrollTo(0,0);
					this.org = data;
					this.isLoaded = true;
					this.ui.setTitle(this.org.name);

					if (this.org.videoLink) {
						this.org.videoLink = this.org.videoLink.replace("watch?v=", "embed/");
						this.videoLink = this.sanitizer.bypassSecurityTrustResourceUrl(this.org.videoLink);
						let matchId = this.org.videoLink.match(/(embed)\/(.*)/);
						if (matchId) { this.videoBg = 'http://i3.ytimg.com/vi/' + matchId[2] + '/mqdefault.jpg'; }
					}

					this.userService.getLoggedInUser((err, user) => {
						if(err) return console.error(err);
						this.user = user;
						this.http.get("/adminToken").map(res => res.json()).subscribe(
							data => {
								this.adminToken = data;
							},
							err => {
								console.error(err);
							}
						);
						this.http.post("/interests", {userId: user._id, categories: this.org.categories, increment: 1})
							.map(res => res.json())
							.subscribe(data => console.log(data), err => console.error(err));
					});
				},
				error => {
					console.error(error);
					this.ui.flash("This page doesn't exist", "error");
					return this.router.navigate([''], { queryParams: {"404": true}});
				}
			);
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

	expandVideo() {
		this.videoIsExpanded = true;
	}

	minimizeVideo() {
		this.videoIsExpanded = false;
	}

	orgIsFavorited(org) {
		if (!this.user || this.user.favorites.indexOf(org._id) === -1) return false;
		else return true;
	}

	favoriteOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up for free or log in to save your favorite organizations", "info");
		this.http.put("/user/favorite/add", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.favorites = this.org.favorites ? this.org.favorites+1 : 1;
			}
		);
	}

	unfavoriteOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up for free or log in to save your favorite organizations", "info");
		this.http.put("/user/favorite/subtract", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.favorites = this.org.favorites ? this.org.favorites-1 : 0;
			}
		);
	}

	userHasPermission(org) {
		if (this.user && this.userIsAdmin()) return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

	toggleOptionsMenu() {
		this.showOptionsMenu = this.showOptionsMenu ? false : true;
	}

	closeOptionsMenu() {
		this.showOptionsMenu = false;
	}

	claimOrg() {
		if (this.user)
			this.router.navigate(['/organization', 'claim', this.org._id]);
		else
			this.ui.flash("Sign up for free or log in to claim this organization", "info");
	}

	createPost(newPost):void {
  	this.http.post('/post', newPost).map(res => res.json()).subscribe(res => {
  		console.log("New post: ", res);
  		if (res.errmsg) {
  			this.ui.flash("Save failed", "error");
  			return;
  		}
  		this.org = res;
 			this.ui.flash("Saved", "success");
  		console.log(res);
  	});
  }

  rateOrg() {
  	this.ratingOrg = true;
  }

  cancelRating() {
  	this.ratingOrg = false;
  }

  submitRating() {
  	if (this.orgRating === null || typeof this.orgRating == "undefined") return this.ui.flash("Select a rating between 0 and 10", "info");
  	this.http.post("/org/rate/" + this.org._id, {rating: this.orgRating, userId: this.user._id}).map(res => res.json()).subscribe(
  		data => {
  			this.ratingOrg = false;
  			if (data.errmsg) {
  				this.ui.flash(data.errmsg, "error");
  				return console.error(data.errmsg);
  			}
  			this.org = data;
  			this.ui.flash("Thanks for rating!", "success");
  		},
  		err => {
  			this.ratingOrg = false;
  			this.ui.flash("Oops! Something went wrong and we couldn't process your rating", "error");
  			console.error(err);
  		}
  	);
  }

  updateRating(rating) {
  	this.orgRating = rating;
  	this.selected = {};
  	this.selected[rating] = true;
  }

}