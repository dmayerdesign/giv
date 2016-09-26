import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'org-details',
	template: `
			<div class="org-details item-details">
				<img [hidden]="!hasCoverImage() || coverImageLinkBroken" [src]="org.coverImage" (error)="badLink($event)" (success)="goodLink()" width="260">
				<div [hidden]="!hasCoverImage() || !coverImageLinkBroken">Broken link :(</div>
				<div [hidden]="hasCoverImage()">No image</div>
				<p>Hello lorem ipsum dolor sit amet {{org.description}}</p>
			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgDetailsComponent implements OnInit {
	@Input() org;
	private coverImageLinkBroken:boolean = false;

	constructor(
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) { }

	ngOnInit() {
		
	}

	badLink($event) {
		this.coverImageLinkBroken = true;
	}

	goodLink() {
		this.coverImageLinkBroken = false;
	}

	hasCoverImage():boolean {
		if (this.org.coverImage
				&& this.org.coverImage.length) { return true; }
		else if (!this.org.coverImage
				|| !this.org.coverImage.length) { return false; }
	}

}