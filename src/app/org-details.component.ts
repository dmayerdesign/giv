import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'org-details',
	template: `
			<div class="item-details">
				<img [hidden]="coverImageLinkBroken" [src]="org.coverImage" (error)="badLink($event)" (success)="goodLink()" width="260">
				<div [hidden]="!coverImageLinkBroken">Broken link :(</div>
			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgDetailsComponent implements OnInit {
	@Input() org;
	@Output() update = new EventEmitter();
	private coverImageLinkBroken:boolean = false;

	constructor(
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) { }

	ngOnInit() {
		
	}

	sendMessage($event) {
		this.update.emit({body: "hello!", type: "info"});
	}

	badLink($event) {
		this.coverImageLinkBroken = true;
	}

	goodLink() {
		this.coverImageLinkBroken = false;
	}

}