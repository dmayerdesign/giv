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
	private adminToken:string;
	private orgWas:any;

	constructor(private userService:UserService,
							private orgService:OrgService,
							private search:SearchService,
							private ui:UIHelper,
							private http:Http) { }

	ngOnInit() {
		this.orgWas = this.org;
	}

	ngDoCheck() {
		if (this.orgWas !== this.org) {
			this.orgWas = this.org;
			if ((!this.user || typeof this.user === "undefined")) {
				this.loadRelated();
			}
			else this.loadRecommendations();
		}
	}

	ngAfterViewInit() {
		this.userService.getLoggedInUser((err, user) => {
			if ((!user || typeof user === "undefined") && this.org) {
				this.loadRelated();
			}
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
			console.log(this.user.starred);
			if (this.user) {
				this.loadRecommendations();
			}
		});
	}

	viewOrg(id:string):void {
		this.selectedOrg = this.recommended.find(function(org) {
			return org._id === id;
		});
	}

	deselectOrg(id:string):void {
		this.selectedOrg = null;
	}

	orgIsStarred(org) {
		if (!this.user || this.user.starred.indexOf(org._id) === -1) return false;
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

		this.recommended = [];
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
