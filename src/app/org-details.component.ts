import { Component, OnInit, AfterContentInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'org-details',
	template: `
			<div class="org-details item-details">
				<p>{{org.description}}</p>
				<a [href]="org.donateLink" target="_blank"><button class="donate-button">{{org.donateLinkCopy || 'Donate'}}</button></a>
				<p class="org-categories" *ngIf="isSingle">Categories: <span *ngFor="let category of org.categories"><a [routerLink]="['', 'category', category.id]">{{category.name}}</a>&nbsp;</span></p>
			</div>`,
	styleUrls: [ 'app/org.styles.css' ],
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgDetailsComponent implements OnInit {
	@Input() org;
	@Input() isSingle;
	@Output() update = new EventEmitter();
	private coverImageLinkBroken:boolean = false;

	constructor(
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) { }

	ngOnInit() {
		
	}

	ngAfterContentInit() {
		this.update.emit("init");
	}

	ngOnDestroy() {
		this.update.emit("destroy");
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