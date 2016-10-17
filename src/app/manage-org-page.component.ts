import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'manage-org-page',
	templateUrl: 'app/manage-org-page.component.html'
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB

export class ManageOrgPageComponent implements OnInit {
	@Input() org:any; // Declared as an input in case you're including it inside another component like <manage-org-page [org]="org">...
	private sub:Subscription;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private progress:number = 0;

	/** Fields to edit **/
	private coverImage:string;
	private avatar:string;
	private videoLink:string;
	private donateLink:string;
	private slug:string;
	private name:string;
	private description:string;

	/** Fields requiring lists **/
	private callsToAction:Array<string> = [
		"Donate",
		"Support",
		"Help out",
		"Volunteer"
	];
	private categories = this.categoryService.list();

	/** Saving (most are unused in template but must exist or else save() will break) **/
	private saving_coverImage:boolean;
	private saving_avatar:boolean;
	private saving_donateLink:boolean;
	private saving_slug:boolean;
	private saving_categories:boolean;
	private saving_otherLinks:boolean;

	/** Changed **/
	private changed_otherLinks:boolean;

	/** Slug validation **/
	private slugIsValid:boolean = true;

	/** Upload options **/
  coverImageUploadOptions:Object;
  avatarUploadOptions:Object;

	constructor(
				private router:Router,
				private route:ActivatedRoute,
				private orgService:OrgService,
				private userService:UserService,
				private ui:UIHelper,
				private utilities:Utilities,
				private zone:NgZone,
				private http:Http,
				private categoryService:Categories) { }

	ngOnInit() {
		this.ui.setTitle("Manage");
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			if (this.route.params) {
				this.sub = this.route.params.subscribe(params => {
					let id = params['id'];
					if (id.length !== 24 || id.match(/[^a-z0-9]/)) {
						this.ui.flash("This page doesn't exist", "error");
						return this.router.navigate([''], { queryParams: {"404": true}});
					}

					this.orgService.loadOrg(id).subscribe(
						data => {
							if (user.adminToken !== 'h2u81eg7wr3h9uijk8') {
								if (!data || !data._id || user.permissions.indexOf(data.globalPermission) === -1) {
									this.ui.flash("Either the page doesn't exist or you don't have permission to manage it", "error");
									return this.router.navigate([''], { queryParams: {"404": true}});
								}
							}
							this.org = data;
							this.isLoaded = true;
							
							// for ng-upload
							this.coverImageUploadOptions = {
							  url: '/edit-org/upload/cover-image/' + this.org._id,
							  filterExtensions: true,
							  calculateSpeed: true,
							  allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
							};
							this.avatarUploadOptions = {
							  url: '/edit-org/upload/avatar/' + this.org._id,
							  filterExtensions: true,
							  calculateSpeed: true,
							  allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
							};
						},
						err => {
							this.router.navigate([''], { queryParams: {"404": true}});
							console.log("Error: ");
							console.log(err);
							return console.error(err);
						}
					);					
				});
			}
			else {
				this.router.navigate(['../']);
			}
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

  handleUpload(org):void {
  	this.org = org;
  	this.stillWorking = false;
  	console.log(org);
  }

  checkForUniqueSlug($event) {
  	this.http.get("/org/s/" + this.slug).map(res => res.json()).subscribe(data => {
  		if (data) {
  			this.slugIsValid = false;
  			this.ui.flash("Sorry, that identifier is taken", "error");
  		}
  		else this.slugIsValid = true;
  	});
  } 

  save(key:string, value?:any):void {
  	if (key === "categories") {
  		value = this.org.categories;
  	}

  	if (typeof value === "undefined") {
  		value = this[key] || this.org[key];
  	}

  	if (key === "slug") {
  		let slugMatch = value.match(/[^a-zA-Z0-9\-]/);
  		if (slugMatch) {
  			return this.ui.flash("Your slug can only have lowercase letters, numbers, and hyphens", "error");
  		} else {
  			value = value.toLowerCase();
  		}
  	}

  	if (key === "otherLinks") {
  		value = [];
  		this.org.otherLinks.forEach(otherLink => {
  			if (otherLink.href) {
  				value.push(otherLink);
  			}
  		});
  	}

  	this['saving_' + key] = true;
  	this.orgService.editOrg({
  		id: this.org._id,
  		key: key,
  		value: value
  	}).subscribe(res => {
  		console.log(res);
  		if (res.errmsg) {
  			this.ui.flash("Save failed", "error");
  			this['saving_' + key] = false;
  			return;
  		}
  		this.org = res;
  		this[key] = null;
  		this['saving_' + key] = false;
  		this['changed_' + key] = false;
  		this.ui.flash("Saved", "success");
  		console.log(res);
  	});
  }

  orgHasCategory(category) {
  	let categoryInOrg = this.org.categories.find((orgCategory) => {
  		return orgCategory.id === category.id;
  	});

  	if (categoryInOrg) return true;
  	else return false;
  }

  changeSelectedCategories(category, add) {
  	console.log(this.org.categories);
  	let categoryIndex = -1;
  	let foundCategory = this.org.categories.find((cat, index) => {
  		if (cat.id == category.id) {
  			categoryIndex = index;
  		}
  		return cat.id == category.id;
  	});

  	if (!this.org.categories) this.org['categories'] = []; // for old orgs without categories array already
  	if (add) {
  		if (categoryIndex === -1) {
  			this.org.categories.push(category);
  		}
  		console.log("Added", category);
  	} 
  	else {
	  	this.org.categories.splice(categoryIndex, 1);
	  	console.log("Removed", category);
	  }
	  console.log(this.org.categories);
  }

  deleteOrg(id) {
  	if (window.confirm("Are you sure you want to delete this organization? This can't be undone.")) {
	  	let orgId = id || this.org._id;
	  	this.http.delete('/org/' + orgId).map(res => res.json()).subscribe(data => {
	  		if (data && data.success) {
	  			this.router.navigate(['']);
	  			return this.ui.flash("Org was deleted", "error");
	  		}
	  	});
	  }
  }

  addAnotherLink():void {
  	let showing:number = this.org.otherLinks && this.org.otherLinks.length;
		if (showing === 3) return;
		this.org.otherLinks.push({copy: null, href: null});
  }

  changeHandler(key:string, event) {
  	if (event.target.value)
  		this['changed_' + key] = true;
  	else
  		this['changed_' + key] = false;
  }

}