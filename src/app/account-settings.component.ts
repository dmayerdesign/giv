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
	templateUrl: 'app/manage-org-page.component.html',
	styleUrls: ['app/org.styles.css', 'app/org-details.component.css', 'app/form-field.component.css', 'app/manage-org-page.component.css']
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB

export class accountSettingsComponent implements OnInit {
	private user:any;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private progress:number = 0;
	private adminToken:string;

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
	private changed_categories:boolean;
	private checked = {};

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
		this.ui.setTitle("Your account");
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

			this.isLoaded = true;

			this.avatarUploadOptions = {
			  url: '/account/upload/avatar/' + this.user._id,
			  filterExtensions: true,
			  calculateSpeed: true,
			  allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
			};

		});
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
  	if (typeof value === "undefined") {
  		value = this[key] || this.org[key];
  	}

  	if (key === "categories") {
  		value = this.user.categories;
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
  		this.user.otherLinks.forEach(otherLink => {
  			if (otherLink.href) {
  				value.push(otherLink);
  			}
  		});
  	}

  	this['saving_' + key] = true;
  	this.orgService.editOrg({
  		id: this.user._id,
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
  		this['saving_' + key] = false;
  		this['changed_' + key] = false;
  		this.ui.flash("Saved", "success");
  		console.log(res);
  	});
  }

  orgHasCategory(category) {
  	let categoryInOrg = this.user.categories.find((orgCategory) => {
  		return orgCategory.id === category.id;
  	});

  	if (categoryInOrg) return true;
  	else return false;
  }

  changeSelectedCategories(category, add) {
  	let categoryIndex = -1;
  	let foundCategory = this.user.categories.find((cat, index) => {
  		if (cat.id == category.id) {
  			categoryIndex = index;
  		}
  		return cat.id == category.id;
  	});

  	if (!this.user.categories) this.org['categories'] = []; // for old orgs without categories array already
  	if (add) {
  		if (categoryIndex === -1) {
  			this.user.categories.push(category);
  			this.checked[category.id] = true;
  		}
  	} 
  	else {
	  	this.user.categories.splice(categoryIndex, 1);
	  	this.checked[category.id] = false;
	  }
  }

  deleteAccount(id) {
  	if (window.confirm("Are you sure you want to delete your account? This can't be undone.")) {
  		if (window.confirm("Sure you're sure?")) {
		  	let userId = id || this.user._id;
		  	this.http.delete('/user/' + userId).map(res => res.json()).subscribe(data => {
		  		if (data && data.success) {
		  			this.router.navigate(['']);
		  			return this.ui.flash("User was deleted successfully", "error");
		  		}
		  	});
		  }
	  }
  }

  changeHandler(key:string, event) {
  	if (event.target.value)
  		this['changed_' + key] = true;
  	else
  		this['changed_' + key] = false;
  }

  userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

}