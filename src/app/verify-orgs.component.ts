import { Component, OnInit } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Subscription } from 'rxjs/Subscription';

import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';
import { SearchBox } from './search-box.component';
import { OrgDetailsComponent } from './org-details.component';
import { TruncatePipe } from './pipes/truncate.pipe';

@Component({
	selector: 'verify-orgs',
	templateUrl: 'app/verify-orgs.component.html',
	styleUrls: [ 'app/org.styles.css', 'app/browse-orgs.component.css' ]
})

export class VerifyOrgsComponent implements OnInit {
	private orgs = [];
	private selectedOrg:any;
	private user:any;
	private searchText:string;
	private searchBoxIsFocused:boolean = false;
	private categoriesList:any;
	private categoryFilter:any = {id: null};
	private viewingOrg:boolean = false;
	private adminToken:string;

	private isLoading = true;
	private loadingOrgSearch = false;
	private loadingShowMoreOrgs = false;

	private singleDetailsAreLoaded:boolean = false;

	constructor(
				private http:Http,
				private orgService:OrgService,
				private ui:UIHelper,
				private utilities:Utilities,
				private route:ActivatedRoute,
				private router:Router,
				private userService:UserService) { }

	ngOnInit() {
		this.ui.setTitle("Verify organizations");

		this.userService.getLoggedInUser((err, user) => {
			if(err) return console.error(err);
			this.user = user;
			this.http.get("/adminToken").map(res => res.json()).subscribe(
				data => {
					this.adminToken = data;
					if (!this.userIsAdmin()) {
						this.router.navigate(['/']);
						this.ui.flash("You don't have permission to do that!", "error");
					}
				},
				err => {
					console.error(err);
				}
			);
			console.log("User: ", user);
		});
	
		this.orgService.loadUnverifiedOrgs({limit: 100}).subscribe(
			data => {
				this.isLoading = false;
				this.orgs = data;
			},
			error => console.log(error)
		);
	}

	searchOrgs(search:string) {
		let query = {search: search, field: "name", bodyField: "description", limit: this.initialLimit};

		if (this.categoryFilter && this.categoryFilter.id) {
			query['filterField'] = "categories.id";
			query['filterValue'] = this.categoryFilter.id;
		}
		this.loadingOrgSearch = true;

		this.orgService.loadOrgs(query)
			.subscribe(
				results => {
					this.orgs = results;
					this.loadingOrgSearch = false;
					this.searchText = search;
				},
				error => console.error(error)
		);
	}

	clearOrgSearch() {
		this.searchOrgs('');
		let searchInput = <HTMLInputElement>document.querySelector(".org-search-box input");
		searchInput.value = "";
	}

	getCategoryById(id) {
		return this.categoriesList.find((category) => {
			if (category) return category.id === id;
			else return false;
		});
	}

	filterByCategory(category) {
		this.categoryFilter = category || {id: null};
		if (category == 'all') this.categoryFilter = {id: null}; 
		this.searchOrgs(this.searchText);
	}

	clearCategoryFilter() {
		this.categoryFilter = {id: null};
		this.searchOrgs(this.searchText);
		if (window.location.href.indexOf("category") > -1) {
			this.router.navigate(['/']);
		}
	}

	showMore(increase:number, offset:number):void {
		let search = (localStorage["searching"] == "true") ? this.searchText : "";
		let query = {limit: increase, offset: offset};
		if (search && search.length) {
			query['search'] = search;
			query['field'] = "name";
			query['bodyField'] = "description";
		}
		if (this.categoryFilter.id) {
			query['filterField'] = "categories.id";
			query['filterValue'] = this.categoryFilter.id;
		}
		this.loadingShowMoreOrgs = true;

		this.orgService.loadOrgs(query).subscribe(
			res => {
				this.loadingShowMoreOrgs = false;
				console.log(res);
				this.orgs = this.orgs.concat(res);
			},
			error => console.log(error)
		);
	}

	toggleSearchBoxFocus(event:string) {
		if (event == 'focus') {
			this.searchBoxIsFocused = true;
		}
		if (event == 'blur') {
			this.searchBoxIsFocused = false;
		}
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

	orgIsStarred(org) {
		if (!this.user || this.user.starred.indexOf(org._id) === -1) return false;
		else return true;
	}

	userHasPermission(org) {
		if (this.userIsAdmin()) return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

	showShowMore() {
		if (this.orgs.length >= this.initialLimit && this.orgs.length < this.totalOrgs) return true;
		else return false;
	}

	verifyOrg(org) {
		let orgIndex = this.orgs.indexOf(org);
		this.orgService.editOrg({
  		id: org._id,
  		key: "verified",
  		value: true
  	}).subscribe(res => {
  		console.log(res);
  		if (res.errmsg) {
  			this.ui.flash("Verification failed", "error");
  			return;
  		}
  		this.orgs.splice(orgIndex, 1);
  		this.ui.flash("Verified", "success");
  		console.log(res);
  	});
	}

}