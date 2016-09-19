import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'single-org',
	template: `
			<div class="single-org" *ngIf="isLoaded">
				<h4>{{org.name}}</h4>
				<org-details [org]="org"></org-details>
				<org-posts [org]="org"></org-posts>
				<input type="file" 
      		ngFileSelect
		      [options]="uploadOptions"
		      (onUpload)="handleUpload($event)">
			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

export class SingleOrgComponent implements OnInit {
	private org;
	private sub:Subscription;
	private isLoaded:boolean = false;

	uploadFile:any;
  uploadOptions:Object;

	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) { }

	ngOnInit() {
		this.sub = this.route.params.subscribe(params => {
			let id = params['id'];
			this.orgService.loadOrg(id).subscribe(
				data => {
					this.org = data;
					this.isLoaded = true;
					this.uploadOptions = {
					  url: '/upload/cover-image/' + this.org._id,
					  filterExtensions: true,
					  allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
					};
				},
				error => console.log(error)
			);
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

  handleUpload(data:any):void {
    if (data && data.response) {
      data = JSON.parse(data.response);
      this.org = data;
    }
  }

}