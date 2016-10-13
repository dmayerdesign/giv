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
	styleUrls: [ 'app/org.styles.css', 'app/single-org.component.css' ]
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
					this.org = data;
					this.isLoaded = true;
					this.ui.setTitle("GIV :: " + this.org.name);

					if (this.org.videoLink) {
						this.org.videoLink = this.org.videoLink.replace("watch?v=", "v/");
						this.videoLink = this.sanitizer.bypassSecurityTrustResourceUrl(this.org.videoLink);
						let matchId = this.org.videoLink.match(/(embed)\/(.*)/);
						if (matchId) { this.videoBg = 'http://i3.ytimg.com/vi/' + matchId[2] + '/mqdefault.jpg'; }
					}

					this.userService.getLoggedInUser((err, user) => {
						if(err) return console.error(err);
						this.user = user;
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

	orgIsStarred(org) {
		if (!this.user || this.user.starred.indexOf(org._id) === -1) return false;
		else return true;
	}

	starOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up for free or log in to save your favorite organizations", "info");
		this.http.put("/user/star/add", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.stars = this.org.stars ? this.org.stars+1 : 1;
			}
		);
	}

	unstarOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up for free or log in to save your favorite organizations", "info");
		this.http.put("/user/star/subtract", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.stars = this.org.stars ? this.org.stars-1 : 0;
			}
		);
	}

	userHasPermission(org) {
		if (this.user && this.user.adminToken === 'h2u81eg7wr3h9uijk8') return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
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

	createPost(newPost:post):void {
  	this.savingPost = true;
  	this.http.post('/post', newPost).map(res => res.json()).subscribe(res => {
  		console.log("New post: ", res);
  		if (res.errmsg) {
  			this.ui.flash("Save failed", "error");
  			this.savingPost = false;
  			return;
  		}
  		this.org = res;
  		this.update.emit(this.org);
  		this.savingPost = false;
  		this.post = new Post();
  			this.ui.flash("Saved", "success");
  		console.log(res);
  	});
  }

}