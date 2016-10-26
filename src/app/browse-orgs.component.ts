import { Component, OnInit, OnDestroy, ViewChildren, ViewChild, Output, ElementRef, HostListener } from '@angular/core';
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
import { OrgPostsComponent } from './org-posts.component';
import { Categories } from './services/categories.service';
import { TruncatePipe } from './pipes/truncate.pipe';

@Component({
	selector: 'browse-orgs',
	templateUrl: 'app/browse-orgs.component.html',
	styleUrls: [ 'app/org.styles.css', 'app/browse-orgs.component.css' ]
})

export class BrowseOrgsComponent implements OnInit {
	@Output() selectedOrg:any = null;
	@Output() user;

	private orgs = [];
	private featuredOrgs = [];
	private featuredShowing:number;
	private initialLimit:number = 14;
	private totalOrgs:number;
	private orgsSorting = {order: "-name"};
	private searchText:string;
	private searchBoxIsFocused:boolean = false;
	private categoriesList:any;
	private categoryFilter:any = {id: null};
	private adminToken:string;

	private isLoading = true;
	private isLoadingFeatured = true;
	private loadingOrgSearch = false;
	private loadingShowMoreOrgs = false;
	private paramsSub:Subscription;

	private singleDetailsAreLoaded:boolean = false;
	private singlePostsAreLoaded:boolean = false;

	private showUpdatesMobileTab:boolean = false;
	private showOrgsMobileTab:boolean = true;

	constructor(
				private http:Http,
				private orgService:OrgService,
				private ui:UIHelper,
				private utilities:Utilities,
				private route:ActivatedRoute,
				private router:Router,
				private userService:UserService,
				private categories:Categories) { }

	ngOnInit() {
		this.ui.setTitle("Browse organizations");
		this.categoriesList = this.categories.list();

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
			console.log("User: ", user);
		});

		/** Check for the current order of orgs (i.e. the current value of localStorage.OrgsSorting) **/
		!this.utilities.existsLocally('OrgsSorting')
			? localStorage.setItem('OrgsSorting', JSON.stringify(this.orgsSorting))
			: this.orgsSorting = JSON.parse(localStorage['OrgsSorting']);
	
		this.orgService.loadOrgs({limit: this.initialLimit}).subscribe(
			data => {
				this.isLoading = false;
				this.orgs = data;

				this.paramsSub = this.route.params.subscribe(params => {
					let categoryId = params['id'];
					if (categoryId) {
						this.categoryFilter = this.getCategoryById(categoryId) || {id: null};
						this.filterByCategory(this.categoryFilter);
						return;
					}
				});

				/** Infinite scrolling! **/
				let orgs = this.orgs;
				document.onscroll = ():void => {
					if (!this.showOrgsMobileTab || this.orgs.length < 14) return;
					let body = document.body;
		    	let html = document.documentElement;
					let height = Math.max( body.scrollHeight, body.offsetHeight, 
		                       		 	 html.scrollHeight, html.offsetHeight, html.clientHeight );
					let winHeight = window.innerHeight;
					if (document.body.scrollTop === (height - winHeight) && document.getElementById("show-more")) {
						document.getElementById("show-more").click();
					}
				};
			},
			error => console.log(error)
		);

		this.orgService.loadOrgs({limit: 6, filterField:"featured", filterValue:"true"}).subscribe(
			data => {
				this.isLoadingFeatured = false;
				this.featuredOrgs = data;
				if (this.featuredOrgs && this.featuredOrgs.length) {
					this.featuredShowing = Math.floor(Math.random() * (this.featuredOrgs.length - 1));
					this.featuredOrgs[this.featuredShowing]['showing'] = true;
				}
			},
			error => console.log(error)
		);

		this.http.get("/orgs/count").map(res => res.json()).subscribe(
			data => {
				if (data.errmsg) return console.error(data.errmsg);
				this.totalOrgs = data;
			}, err => {
				console.error(err);
			}
		);
	}

	ngOnDestroy() {
		this.paramsSub.unsubscribe();
	}

	toggleOrder(attr) {
		if (this.orgsSorting.order.indexOf(attr) === -1) {
			this.orgsSorting.order = '-' + attr;
		}
		else {
			if (this.orgsSorting.order.indexOf('-') > -1) {
				this.orgsSorting.order = '+' + attr;
			} else {
				this.orgsSorting.order = '-' + attr;
			}
		}
		localStorage.setItem('OrgsSorting', JSON.stringify(this.orgsSorting));
	}

	isAscending(order:string) {
		if (order.indexOf("+") > -1) {
			return true;
		} else {
			return false;
		}
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

	starOrg(id):void {				
		let featuredOrgToStar = this.featuredOrgs.find(thisOrg => {
			return thisOrg._id === id;
		});
		if (featuredOrgToStar)
			featuredOrgToStar.stars = featuredOrgToStar.stars ? featuredOrgToStar.stars+1 : 1;
	}

	unstarOrg(id):void {				
		let featuredOrgToUnStar = this.featuredOrgs.find(thisOrg => {
			return thisOrg._id === id;
		});
		if (featuredOrgToUnStar)
			featuredOrgToUnStar.stars = featuredOrgToUnStar.stars ? featuredOrgToUnStar.stars-1 : 0;
	}

	// starFeaturedOrg(org):void {
	// 	let featuredOrg = this.featuredOrgs.find(featured => {
	// 		return featured._id === org._id;
	// 	});
	// 	if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
	// 	this.http.put("/user/star/add", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
	// 		data => {
	// 			if (data.errmsg) return console.error(data.errmsg);
	// 			this.user = data.user;
	// 			this.orgs.find(org => {
	// 				return org._id === data.org._id;
	// 			}).stars++;
	// 			featuredOrg.stars = featuredOrg.stars ? featuredOrg.stars+1 : 1;
	// 		},
	// 		err => {
	// 			console.error(err);
	// 		}
	// 	);
	// }

	cycleFeatured(inc:number) {
		this.featuredOrgs[this.featuredShowing]['showing'] = false;
		this.featuredShowing += inc;

		if (this.featuredShowing === -1) {
			this.featuredShowing = (this.featuredOrgs.length - 1);
		}
		if (this.featuredShowing === this.featuredOrgs.length) {
			this.featuredShowing = 0;
		}
		this.featuredOrgs[this.featuredShowing]['showing'] = true;
	}

	showFeatured(index:number) {
		this.featuredOrgs[this.featuredShowing]['showing'] = false;
		this.featuredShowing = index;
		this.featuredOrgs[this.featuredShowing]['showing'] = true;
	}

	userHasPermission(org) {
		if (this.userIsAdmin()) return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

	showOrgs(e) {
		this.showOrgsMobileTab = true;
		this.showUpdatesMobileTab = false;
	}

	showUpdates() {
		this.showOrgsMobileTab = false;
		this.showUpdatesMobileTab = true;
	}

	showShowMore() {
		if (this.orgs.length >= this.initialLimit && this.orgs.length < this.totalOrgs) return true;
		else return false;
	}

}