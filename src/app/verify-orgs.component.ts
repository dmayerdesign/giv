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
	private viewingOrg:boolean = false;

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
			if (!this.isAdmin(user)) {
				this.router.navigate(['/']);
				return this.ui.flash("You don't have permission to do that!", "error");
			}
			this.user = user;
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

	isAscending(order:string) {
		if (order.indexOf("+") > -1) {
			return true;
		} else {
			return false;
		}
	}

	searchOrgs(search:string) {
		let query = {search: search, field: "name", bodyField: "description", limit: 100};

		this.loadingOrgSearch = true;

		this.orgService.loadUnverifiedOrgs(query)
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

	showMore(increase:number, offset:number):void {
		let search = (localStorage["searching"] == "true") ? this.searchText : "";
		let query = {limit: increase, offset: offset};
		if (search && search.length) {
			query['search'] = search;
			query['field'] = "name";
			query['bodyField'] = "description";
		}
		this.loadingShowMoreOrgs = true;

		this.orgService.loadUnverifiedOrgs(query).subscribe(
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

	viewOrg(e:any, id:string):void {
		let findOrg = function(org) {
			return org._id === id;
		}
		this.selectedOrg = this.orgs.find(findOrg);
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
		}
	}

	revealOrgDetails(event) {
		if (event == "init") {
			this.singleDetailsAreLoaded = true;
		}
	}

	userHasPermission(org) {
		if (this.user && this.user.adminToken === 'h2u81eg7wr3h9uijk8') return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	isAdmin(user) {
		if (user.adminToken === 'h2u81eg7wr3h9uijk8') return true;
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