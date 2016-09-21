import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { UIHelper, Utilities } from './services/app.service';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
	selector: 'manage-org-page',
	template: `
			<div class="manage-org-page" *ngIf="isLoaded">
				<a *ngIf="org.slug" href="/organization/{{org.slug}}">Back to page</a>
				<a *ngIf="!org.slug" href="/organization/i/{{org._id}}">Back to page</a>
				<h4>Manage {{org.name}}</h4>
				<img [src]="org.coverImage" width="200">
				
				<div class="edit-field-container">
					<input type="file"
						class="form-control"
	      		ngFileSelect
			      [options]="uploadOptions"
			      (onUpload)="handleUpload($event)">

			    <span class="upload-status" *ngIf="progress && stillWorking"><i class="fa fa-circle-o-notch fa-spin"></i></span>
			    <span class="upload-status" *ngIf="progress && !stillWorking"><i class="fa fa-check"></i></span>
			    <span class="editing-tip">If you want to upload a file larger than 3 MB, go <a href="http://compressjpeg.com">here for JPEGs</a> and <a href="http://tinypng.com">here for PNGs.</a></span>
			  	<span class="editing-tip">If your file is publicly accessible on the Internet, simply paste the link below.</span>
			  </div>
		    <div class="edit-field-container">
		    	<input [(ngModel)]="coverImageLink"
		    				class="form-control"
	      				name="coverImageLink"
		    				placeholder="Change the cover image"><button (click)="editOrg('coverImage', coverImageLink)"><i [hidden]="!loading_coverImage" class="fa fa-circle-o-notch fa-spin"></i>Apply</button>
		    </div>
		    <div class="edit-field-container">
		    	<input [(ngModel)]="donateLink"
		    				class="form-control"
	      				name="donateLink"
		    				placeholder="Change the main Donate link"><button (click)="editOrg('donateLink', donateLink)"><i [hidden]="!loading_donateLink" class="fa fa-circle-o-notch fa-spin"></i>Apply</button>
		    </div>
		    <div class="edit-field-container">
		    	<input [(ngModel)]="slug"
		    				class="form-control"
	      				(keyup)="checkForUniqueSlug($event)"
		    				ngControl="slug"
		    				name="slug"
		    				placeholder="{{org.slug || 'e.g. my-awesome-org'}}"><button [disabled]="!slugIsValid" (click)="editOrg('slug', slug)"><i [hidden]="!loading_slug" class="fa fa-circle-o-notch fa-spin"></i>Apply</button>
		    </div>
		    <div class="edit-field-container">
		    	<input [(ngModel)]="name"
		    				class="form-control"
	      				ngControl="name"
		    				name="name"
		    				placeholder="Change the name of the page"><button (click)="editOrg('name', name)"><i [hidden]="!loading_name" class="fa fa-circle-o-notch fa-spin"></i>Apply</button>
				</div>
			</div>`,
	providers: [OrgService, UserService, UIHelper, Utilities]
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB
// __TO_DO__: add an external link option

export class ManageOrgPageComponent implements OnInit {
	@Input() org; // Declared as an Input in case you're including it inside another template like <manage-org-page [org]="org"></...>
	private sub:Subscription;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private progress:number = 0;

	private coverImageLink:string;
	private donateLink:string;
	private slug:string;
	private name:string;

	private loading_coverImage:boolean;
	private loading_donateLink:boolean;
	private loading_slug:boolean;
	private slugIsValid:boolean = true;

	uploadFile:any;
  uploadOptions:Object;

	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private orgService: OrgService,
				private userService: UserService,
				private helper: UIHelper,
				private utilities: Utilities,
				private zone: NgZone,
				private flash: FlashMessagesService,
				private http: Http) { }

	ngOnInit() {
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			if (this.route.params) {
				this.sub = this.route.params.subscribe(params => {
					let id = params['id'];
					if (id.length !== 24 || id.match(/[^a-z0-9]/)) {
						this.flash.show("This page doesn't exist");
						return this.router.navigate([''], { queryParams: {"404": true}});
					}

					this.orgService.loadOrg(id).subscribe(
						data => {
							if (!data || !data._id || user.permissions.indexOf(data.globalPermission) === -1) {
								this.flash.show("Either the page doesn't exist or you don't have permission to manage it");
								return this.router.navigate([''], { queryParams: {"404": true}});
							}
							this.org = data;
							this.isLoaded = true;

							
							// for ng-upload
							this.uploadOptions = {
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

  handleUpload(data:any):void {
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
  		if (data) this.slugIsValid = false;
  		else this.slugIsValid = true;
  	});
  } 

  editOrg(key:string, value:string):void {
  	if (key === "slug") {
  		let slugMatch = value.match(/[^a-zA-Z0-9\-]/);
  		if (slugMatch) {
  			return this.flash.show("Your slug can only have lowercase letters and hyphens");
  		} else {
  			value.toLowerCase();
  		}
  	}

  	this['loading_' + key] = true;
  	this.orgService.editOrg({
  		id: this.org._id,
  		key: key,
  		value: value
  	}).subscribe(res => {
  		console.log(res);
  		if (res.errmsg) {
  			this.flash.show("Save failed", {class: "error"});
  			this['loading_' + key] = false;
  			return;
  		}
  		this.org = res;
  		this['loading_' + key] = false;
  		this.flash.show("Saved");
  		console.log(res);
  	});
  }

}