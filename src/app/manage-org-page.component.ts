import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'manage-org-page',
	template: `
			<div class="manage-org-page" *ngIf="isLoaded">
				<a href="/organization/{{org._id}}">Back to page</a>
				<h4>Manage {{org.name}}</h4>
				<img [src]="org.coverImage" width="200">
				<input type="file" 
      		ngFileSelect
		      [options]="uploadOptions"
		      (onUpload)="handleUpload($event)">

		    <span *ngIf="progress && stillWorking"><i class="fa fa-circle-o-notch fa-spin"></i></span>
		    <span *ngIf="progress && !stillWorking"><i class="fa fa-check"></i></span>

		    <input [(ngModel)]="coverImageLink"><button (click)="editCoverImage(coverImageLink)"><i [hidden]="!loadingCoverImage" class="fa fa-circle-o-notch fa-spin"></i>Apply</button>
			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB
// __TO_DO__: add an external link option

export class ManageOrgPageComponent implements OnInit {
	@Input() org; // Declared as an Input in case you're including it inside another template like <manage-org-page [org]="org"></...>
	private sub:Subscription;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private loadingCoverImage:boolean = false;
	private progress:number = 0;
	private coverImageLink:string;

	uploadFile:any;
  uploadOptions:Object;

	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities,
				private zone: NgZone) { }

	ngOnInit() {
		if (this.route.params) {
			this.sub = this.route.params.subscribe(params => {
				let id = params['id'];
				this.orgService.loadOrg(id).subscribe(
					data => {
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
					error => console.log(error)
				);
			});
		}
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

  handleUpload(data:any):void {
  	this.zone.run(() => {
  		console.log(data);
  		this.progress = data.progress.percent;
  		this.stillWorking = true;
	    if (data.response) {
	    	this.org = JSON.parse(data.response);
	    	this.stillWorking = false;
	    	console.log(data.response);
	    }
    });
  }

  editCoverImage(path:string):void {
  	this.loadingCoverImage = true;
  	this.orgService.editOrg({
  		id: this.org._id,
  		key: "coverImage",
  		value: path
  	}).subscribe(org => {
  		this.org = org;
  		this.loadingCoverImage = false;
  		console.log(org);
  	});
  }

}