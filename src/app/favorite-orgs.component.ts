import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';
import { UIHelper } from './services/app.service';
import { SearchService } from './services/search.service';

@Component({
	selector: 'favorite-orgs',
	templateUrl: 'app/favorite-orgs.component.html',
	styleUrls: ['app/browse-orgs.component.css', 'app/org.styles.css']
})

export class FavoriteOrgsComponent implements OnInit {
	private user:any;
	private orgs = [];
	private recommended = [];
	private recommendedOrgsAreLoaded:boolean = false;
	private loadingShowMoreOrgs:boolean = false;
	private viewingOrg:boolean = false;
	private selectedOrg:any = null;
	private singleDetailsAreLoaded:boolean;
	private singlePostsAreLoaded:boolean;
	private showFavoritesMobileTab:boolean = true;
	private showRecommendedMobileTab:boolean = false;
	private adminToken:string;
	private isLoaded:boolean;

	constructor(private userService:UserService,
							private orgService:OrgService,
							private search:SearchService,
							private ui:UIHelper,
							private http:Http) { }

	ngOnInit() {
		this.ui.setTitle("Your favorites");
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			this.user = user;
			this.http.get("/adminToken").map(res => res.json()).subscribe(
				data => {
					this.adminToken = data;
				},
				err => {
					console.error(err);
				}
			);
			console.log(this.user.favorites);
			this.loadOrgs(this.user.favorites);
		});
	}

	loadOrgs(favorited:any, cb?:any) {
		this.orgService.loadFavoriteOrgs(favorited)
			.subscribe(
				results => {
					this.orgs = results;
					console.log("Favorite orgs: ", this.orgs);
					this.loadRecommendations();
					this.isLoaded = true;
				},
				error => {
					console.error(error);
					this.isLoaded = true;
				}
		);
	}

	viewOrg(id:string):void {
		this.selectedOrg = null;
		this.selectedOrg = this.orgs.find(function(org) {
			return org._id === id;
		});
	}

	deselectOrg(id:string):void {
		this.selectedOrg = null;
	}

	orgIsFavorited(org) {
		if (!this.user || this.user.favorites.indexOf(org._id) === -1) return false;
		else return true;
	}

	revealOrgDetails(event) {
		if (event == "init") {
			this.singleDetailsAreLoaded = true;
		}
	}

	revealOrgPosts(event) {
		if (event == "init") {
			this.singlePostsAreLoaded = true;
		}
	}

	userHasPermission(org) {
		if (this.user && this.userIsAdmin()) return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

	loadRecommendations() {
		let interests = [];
		let query = {};
		for (let interest in this.user.interests) {
      interests.push([interest, this.user.interests[interest]]);
		}
		interests.sort((a, b) => {
        return b[1] - a[1];
    });

    console.log(interests);

		if (!interests || !interests.length) {
			return this.recommendedOrgsAreLoaded = true;
		}

    query['filterField'] = "categories.id";
    query['filterValue'] = interests[0] && interests[0][0];
    query['limit'] = 4;
    query['sort'] = "-favorites";
    query['not'] = [];
    this.orgs.forEach(org => {
    	query['not'].push(org._id);
    });

    console.log("Query: ", query);

    this.search.loadSearchableData("/orgs/get", query).subscribe(orgs => {
    	orgs.forEach(org => {
    		this.recommended.push(org);
    	});

    	if (!interests[1] || !interests[1][0]) return this.recommendedOrgsAreLoaded = true;

    	query['filterValue'] = interests[1][0];
    	query['limit'] = 2;
    	this.orgs.forEach(org => {
	    	if (query['not'].indexOf(org._id) < 0) query['not'].push(org._id);
	    });
	    this.recommended.forEach(org => {
	    	if (query['not'].indexOf(org._id) < 0) query['not'].push(org._id);
	    });
    	this.search.loadSearchableData("/orgs/get", query).subscribe(orgs => {
	    	orgs.forEach(org => {
	    		this.recommended.push(org);
	    	});
	    	this.recommendedOrgsAreLoaded = true;
	    }, err => {
	    	this.ui.flash("Something went wrong while loading your recommendation", "error");
	    	return console.error(err);
	    });
    }, err => {
    	this.ui.flash("Sorry, we couldn't load your recommendations", "error");
    	return console.error(err);
    });
	}

	showFavorites(e) {
		this.showRecommendedMobileTab = false;
		this.showFavoritesMobileTab = true;
	}

	showRecommended() {
		this.showRecommendedMobileTab = true;
		this.showFavoritesMobileTab = false;
	}

	unfavorite(orgToUnfavorite) {
		let i;
		this.orgs.forEach((org, index, arr) => {
			if (org._id === orgToUnfavorite._id) {
				i = index;
			}
		});
		this.orgs.splice(i, 1);
	}

}
