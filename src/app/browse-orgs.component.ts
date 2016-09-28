import { Component, OnInit, OnDestroy, ViewChildren, ViewChild, Input, Output, ElementRef, HostListener } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Subscription } from 'rxjs/Subscription';
import { FlashMessagesService } from 'angular2-flash-messages';

import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities, InfoMessage } from './services/app.service';
import { SearchBox } from './search-box.component';
import { OrgDetailsComponent } from './org-details.component';
import { OrgPostsComponent } from './org-posts.component';
import { Categories } from './services/categories.service';
import { Observable } from 'rxjs/Rx';

@Component({
	selector: 'orgs-list',
	templateUrl: 'app/browse-orgs.component.html',
	styleUrls: [ 'app/browse-orgs.component.css' ],
	providers: [OrgService, UIHelper, Utilities],
	directives: [SearchBox, OrgDetailsComponent, OrgPostsComponent],
	pipes: []
})

export class BrowseOrgsComponent implements OnInit {
	@ViewChildren('singleItem') $orgs = [];
	@Output() selectedOrg:any = null;
	@Output() user;

	private orgs = [];
	private featuredOrgs = [];
	private featuredShowing:number;
	private orgsLoaded:number = 20;
	private orgsShowing:number;
	private orgsSorting = {order: "-name"};
	private searchText:string;
	private searchBoxIsFocused:boolean = false;
	private viewingOrg:boolean = false;
	private orgExpanded:boolean = false;
	private viewingFeaturedOrg:boolean = false;
	private categoriesList:any;
	private categoryFilter:any = {id: null};

	private isLoading = true;
	private isLoadingFeatured = true;
	private loadingOrgSearch = false;
	private paramsSub:Subscription;
	private options = new RequestOptions({ headers: new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' }) });

	private singleDetailsAreLoaded:boolean = false;
	private singlePostsAreLoaded:boolean = false;

	constructor(
				private http:Http,
				private orgService:OrgService,
				private helper:UIHelper,
				private utilities:Utilities,
				private route:ActivatedRoute,
				private flash:FlashMessagesService,
				private userService:UserService,
				private categories:Categories) {


	}

	ngOnInit() {
		this.helper.setTitle("Browse organizations");
		this.categoriesList = this.categories.list();

		this.userService.getLoggedInUser((err, user) => {
			if(err) return console.error(err);
			this.user = user;
			console.log("User: ", user);
		});

		/** Check for the current order of orgs (i.e. the current value of localStorage.OrgsSorting) **/
		!this.utilities.existsLocally('OrgsSorting')
			? localStorage.setItem('OrgsSorting', JSON.stringify(this.orgsSorting))
			: this.orgsSorting = JSON.parse(localStorage['OrgsSorting']);
	
		this.orgService.loadOrgs({limit:20}).subscribe(
			data => {
				this.isLoading = false;
				this.orgs = data;
				this.takeCount(this.orgs);

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
				document.onscroll = function() {
					let body = document.body;
		    	let html = document.documentElement;
					let height = Math.max( body.scrollHeight, body.offsetHeight, 
		                       		 	 html.scrollHeight, html.offsetHeight, html.clientHeight );
					let winHeight = window.innerHeight;
					console.log(height);
					console.log(document.body.scrollTop);
					if (document.body.scrollTop === (height - winHeight)) {
						console.log(orgs);
						document.getElementById("show-more").click();
					}
				};
			},
			error => console.log(error)
		);

		this.orgService.loadOrgs({limit:6, filterField:"featured", filterValue:"true"}).subscribe(
			data => {
				this.isLoadingFeatured = false;
				this.featuredOrgs = data;
				this.featuredShowing = Math.floor(Math.random() * (this.featuredOrgs.length - 1));
				this.featuredOrgs[this.featuredShowing]['showing'] = true;
			},
			error => console.log(error)
		);
	}

	ngOnDestroy() {
		this.paramsSub.unsubscribe();
	}

	ngDoCheck() {
		this.takeCount(this.$orgs);
	}

	takeCount(children:any) {
		this.orgsShowing = this.helper.takeCount(children);
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
		let query = {search: search, field: "name", bodyField: "description", limit: 20};

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
		document.querySelector(".org-search-box input").value = ""; // if there's a TypeScript validation error here, ignore it
	}

	getCategoryById(id) {
		return this.categoriesList.find((category) => {
			if (category) return category.id === id;
			else return false;
		});
	}

	filterByCategory(category) {
		this.categoryFilter = category || {id: null};
		this.searchOrgs(this.searchText);
	}

	clearCategoryFilter() {
		this.categoryFilter = {id: null};
		this.searchOrgs(this.searchText);
		if (window.location.href.indexOf("category") > -1) {
			window.location.href = "";
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
		this.loadingOrgSearch = true;

		this.orgService.loadOrgs(query).subscribe(
			res => {
				this.loadingOrgSearch = false;
				console.log(res);
				this.orgs = this.orgs.concat(res);
				this.takeCount(this.$orgs);
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

	viewFeaturedOrg(id:string):void {
		let findOrg = function(org) {
			return org._id === id;
		}
		this.viewingFeaturedOrg = true;
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
		if (this.user.starred.indexOf(org._id) === -1) return false;
		else return true;
	}

	starOrg(orgId) {
		this.http.put("/user/star/add", {orgId: orgId, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.orgs.find((org) => {
					return org._id === orgId;
				}).stars++;
				console.log(data.org);
				console.log(data.user);
			}
		);
	}

	unstarOrg(orgId) {
		this.http.put("/user/star/subtract", {orgId: orgId, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.orgs.find((org) => {
					return org._id === orgId;
				}).stars--;
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

}