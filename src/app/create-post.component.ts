	// authorId: {type: String},
	// title: {type: String, index: true},
	// content: {type: String, index: true},
	// org: {type: String, index: true},
	// dateCreated: {type: Date, default: Date.now()}

import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { UIHelper, Utilities } from './services/app.service';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
	selector: 'create-post',
	template: `<h3>Create post</h3>`,
	providers: [OrgService, UserService, UIHelper, Utilities]
})

export class CreatePostComponent implements OnInit {
	@Input() org;
	@Input() user;
	private sub:Subscription;
	private stillWorking:boolean = false;
	private progress:number = 0;

	private post:{
		authorId: string,
		title: string,
		content: string,
		org: string,
		images: [string]
	};

	private loadingImage:boolean;

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
						this.flash.show("This page doesn't exist", {cssClass: "error"});
						return this.router.navigate([''], { queryParams: {"404": true}});
					}

					if (!this.org || !this.org._id || user.permissions.indexOf(this.org.globalPermission) === -1) {
						this.flash.show("Either the page doesn't exist or you don't have permission to manage it", {cssClass: "error"});
						return this.router.navigate([''], { queryParams: {"404": true}});
					}

					
					// for ng-upload
					// this.uploadOptions = {
					//   url: '/edit-post/upload/image/' + this.post._id,
					//   filterExtensions: true,
					//   calculateSpeed: true,
					//   allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
					// };

					this.orgService.loadOrg(id).subscribe(
						data => {
							
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

  // handleUpload(data:any):void {
  // 	this.zone.run(() => {
  // 		console.log(data);
  // 		this.progress = data.progress.percent;
  // 		this.stillWorking = true;

	 //    if (data.response && data.status !== 404) {
	 //    	this.org = JSON.parse(data.response);
	 //    	this.stillWorking = false;
	 //    	console.log(data.response);
	 //    }
  //   });
  // }

  editOrg(key:string, value:string):void {
  	if (key === "slug") {
  		let slugMatch = value.match(/[^a-zA-Z0-9\-]/);
  		if (slugMatch) {
  			return this.flash.show("Your slug can only have lowercase letters, numbers, and hyphens", {cssClass: "error"});
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
  			this.flash.show("Save failed", {cssClass: "error"});
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