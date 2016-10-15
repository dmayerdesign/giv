import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';
import { Validators, FormGroup, FormArray, FormBuilder } from '@angular/forms';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { Categories } from './services/categories.service';
import { FormBlock } from './services/form.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'manage-org-page',
	templateUrl: 'app/manage-org-page.component.html'
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB

export class ManageOrgPageComponent implements OnInit {
	@Input() org:any; // Declared as an input in case you're including it inside another component like <manage-org-page [org]="org"></...>
	private sub:Subscription;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private progress:number = 0;

	private newOrg:any = {};
	private coverImageLink:string;
	private avatarLink:string;
	private videoLink:string;
	private donateLink:string;
	private slug:string;
	private name:string;
	private description:string;

	//private form:FormBlock[];
	public form:FormGroup; // our form model

	private uploads = {
		coverImage: {
			options: {},
			upload: this.coverImageUpload
		}
	};

	private callsToAction:string[] = [
		"Donate",
		"Support",
		"Help out",
		"Volunteer"
	];

	private categories = this.categoryService.list();

	private loading_coverImage:boolean;
	private loading_avatar:boolean;
	private loading_donateLink:boolean;
	private loading_slug:boolean;
	private loading_categories:boolean;
	private slugIsValid:boolean = true;

	constructor(
				private router:Router,
				private route:ActivatedRoute,
				private orgService:OrgService,
				private userService:UserService,
				private ui:UIHelper,
				private utilities:Utilities,
				private zone:NgZone,
				private http:Http,
				private categoryService:Categories,
				private formBuilder:FormBuilder) { }

	ngOnInit() {
		this.ui.setTitle("GIV :: Manage");
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

							// for editing
							this.newOrg['categories'] = this.org.categories;
							this.newOrg['otherLinks'] = this.org.otherLinks;
							this.restoreOtherLinks();

							console.log("New org", this.newOrg);

							// this.form = [
							// 	{
							// 		className: "visuals",
							// 		save: this.editOrg,
							// 		fields: [
							// 			{
							// 				element: "input",
							// 				type: "url",
							// 				title: "Cover image",
							// 				model: "coverImage",
							// 				placeholder: "'Paste a link to an image'",
							// 				upload: true
							// 			},
							// 			{
							// 				element: "input",
							// 				type: "url",
							// 				title: "Cover video",
							// 				model: "coverImage",
							// 				placeholder: "Paste a link to an image",
							// 			}
							// 		]
							// 	},
							// 	{
							// 		className: "other-links",
							// 		save: this.editOrg,
							// 		fields: [
							// 			{
							// 				element: "input",
							// 				type: "text",
							// 				model: "otherLinks[0].copy",
							// 				title: "Text for your link",
							// 				placeholder: "'e.g. Sign up to volunteer'"
							// 			},
							// 			{
							// 				element: "input",
							// 				type: "url",
							// 				model: "otherLinks[0].href"
							// 			},
							// 			{
							// 				element: "input",
							// 				type: "text",
							// 				model: "otherLinks[1].copy",
							// 				title: "Text for your link",
							// 				placeholder: "'e.g. Sign up to volunteer'"
							// 			},
							// 			{
							// 				element: "input",
							// 				type: "url",
							// 				model: "otherLinks[1].href"
							// 			},
							// 			{
							// 				element: "input",
							// 				type: "text",
							// 				model: "otherLinks[2].copy",
							// 				title: "Text for your link",
							// 				placeholder: "'e.g. Sign up to volunteer'"
							// 			},
							// 			{
							// 				element: "input",
							// 				type: "url",
							// 				model: "otherLinks[2].href"
							// 			}
							// 		]
							// 	}
							// ];
							
							// for ng-upload
							this.uploads.coverImage.options = {
							  url: '/edit-org/upload/cover-image/' + this.org._id,
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

  coverImageUpload(data:any):void {
  	this.zone.run(() => {
  		console.log(data);
  		this.progress = data.progress.percent;
  		this.stillWorking = true;

	    if (data.response && data.status !== 404) {
	    	this.org = JSON.parse(data.response);
	    	this.stillWorking = false;
	    	console.log(data.response);
	    }
    });
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

  editOrg(key, value?):void {
  	value = value || this.newOrg[key];

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
  		this.newOrg.otherLinks.forEach(otherLink => {
  			if (otherLink.href) {
  				value.push(otherLink);
  			}
  		});
  	}

  	this['loading_' + key] = true;
  	this.orgService.editOrg({
  		id: this.org._id,
  		key: key,
  		value: value
  	}).subscribe(res => {
  		console.log(res);
  		if (res.errmsg) {
  			this.ui.flash("Save failed", "error");
  			this['loading_' + key] = false;
  			this.restoreOtherLinks();
  			return;
  		}
  		this.org = res;
  		this['loading_' + key] = false;
  		this.ui.flash("Saved", "success");
  		this.restoreOtherLinks();
  		console.log(res);
  	});
  }

  orgHasCategory(category) {
  	if (!this.org) return false;

  	let categoryInOrg = this.org.categories.find((orgCategory) => {
  		return orgCategory.id === category.id;
  	});

  	if (categoryInOrg) return true;
  	else return false;
  }

  changeSelectedCategories(category, add) {
  	let categoryIndex = -1;
  	if (!this.newOrg.categories) this.newOrg['categories'] = []; // for old orgs without categories array already
  	this.newOrg.categories.forEach((cat, index) => {
  		if (cat.id == category.id) {
  			categoryIndex = index;
  		}
  	});

  	if (add) {
  		if (categoryIndex === -1) {
  			this.newOrg.categories.push(category);
  		}
  		console.log("Added", category);
  	} 
  	else {
	  	this.newOrg.categories.splice(categoryIndex, 1);
	  	console.log("Removed", category);
	  }
	  console.log(this.newOrg.categories);
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

  restoreOtherLinks() {
  	// for editing
		let addNullOtherLinks:number = this.newOrg.otherLinks && this.newOrg.otherLinks.length ? 3 - this.newOrg.otherLinks.length : 3;
		if (addNullOtherLinks === 3) this.newOrg.otherLinks = [];
		while (addNullOtherLinks > 0) {
			this.newOrg.otherLinks.push({copy: null, href: null});
			addNullOtherLinks--;
		}
  }

}