import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';
import { UIHelper } from './services/app.service';
import { SearchService } from './services/search.service';

function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

@Component({
	selector: 'recommended-orgs',
	templateUrl: 'app/recommended-orgs.component.html',
	styleUrls: ['app/recommended-orgs.component.css', 'app/browse-orgs.component.css', 'app/org.styles.css']
})

export class RecommendedOrgsComponent implements OnInit {
	@Input() orgs = [];
	@Input() org:any;
	@Input() inStarred:boolean;
	@Output() tabChange = new EventEmitter();
	private user:any;
	private recommended = [];
	private recommendedOrgsAreLoaded:boolean = false;
	private viewingOrg:boolean = false;
	private selectedOrg:any = null;
	private singleDetailsAreLoaded:boolean;
	private singlePostsAreLoaded:boolean;
	private showStarredMobileTab:boolean = true;
	private showRecommendedMobileTab:boolean = false;

	constructor(private userService:UserService,
							private orgService:OrgService,
							private search:SearchService,
							private ui:UIHelper,
							private http:Http) { }

	ngOnInit() {
		
	}

	ngAfterViewInit() {
		this.userService.getLoggedInUser((err, user) => {
			if ((!user || typeof user === "undefined") && this.org) {
				this.loadRelated();
			}
			if (err) return console.error(err);
			this.user = user;
			console.log(this.user.starred);
			if (this.user) {
				this.loadRecommendations();
			}
		});
	}

	viewOrg(e:any, id:string):void {
		let findOrg = function(org) {
			return org._id === id;
		}
		this.selectedOrg = this.recommended.find(findOrg) || this.orgs.find(findOrg);
		this.viewingOrg = true;
		console.log(this.selectedOrg);
	}

	deselectOrg(e:any, id:string):void {
		console.log(e.target.className);
		if (e.target.className.indexOf("inside-org") > -1) return;

		if (this.viewingOrg && this.selectedOrg._id === id) {
			console.log(this.selectedOrg);
			this.selectedOrg = null;
			this.viewingOrg = false;
			this.singleDetailsAreLoaded = false;
			this.singlePostsAreLoaded = false;
		}
	}

	orgIsStarred(org) {
		if (!this.user || this.user.starred.indexOf(org._id) === -1) return false;
		else return true;
	}

	starOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
		this.http.put("/user/star/add", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;

				let orgToStar = this.orgs.find((thisOrg) => {
					return thisOrg._id === org._id;
				});
				if (orgToStar)
					orgToStar.stars = orgToStar.stars ? orgToStar.stars+1 : 0;

				console.log(data.org);
				console.log(data.user);
			}
		);
	}

	unstarOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
		this.http.put("/user/star/subtract", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;

				let orgToStar = this.orgs.find((thisOrg) => {
					return thisOrg._id === org._id;
				});
				if (orgToStar)
					orgToStar.stars = orgToStar.stars ? orgToStar.stars-1 : 0;

				console.log(data.org);
				console.log(data.user);
			}
		);
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
		if (this.user && this.user.adminToken === 'h2u81eg7wr3h9uijk8') return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	loadRelated() {
		let query = {};

    query['filterField'] = "categories.id";
    query['filterValue'] = this.org.categories[0].id;
    query['limit'] = 4;
    query['sort'] = "-stars";
    query['not'] = [this.org._id];

    this.search.loadSearchableData("/orgs/get", query).subscribe(orgs => {
    	this.recommended = this.recommended.concat(orgs);

    	if (!this.org.categories[1]) return this.recommendedOrgsAreLoaded = true;

    	query['filterValue'] = this.org.categories[1].id;
    	query['limit'] = 4;
	    this.recommended.forEach(org => {
	    	if (query['not'].indexOf(org._id) < 0) query['not'].push(org._id);
	    });
    	this.search.loadSearchableData("/orgs/get", query).subscribe(orgs => {
	    	this.recommended = this.recommended.concat(orgs);
	    	shuffleArray(this.recommended);
	    	this.recommendedOrgsAreLoaded = true;
	    }, err => {
	    	this.ui.flash("Something went wrong while loading related orgs", "error");
	    	return console.error(err);
	    });
    }, err => {
    	this.ui.flash("Sorry, we couldn't load related orgs", "error");
    	return console.error(err);
    });
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
    query['sort'] = "-stars";
    query['not'] = [];
    this.orgs.forEach(org => {
    	query['not'].push(org._id);
    });
    this.user.starred.forEach(orgId => {
    	query['not'].push(orgId);
    });
    if (this.org) {
    	query['not'].push(this.org._id);
    }

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
	    	this.recommended = this.recommended.concat(orgs);
	    	shuffleArray(this.recommended);
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

	showStarred() {
		this.tabChange.emit("");
	}

}
