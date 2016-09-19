import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'org-details',
	template: `
			<div class="item-details">
				<img (click)="sendMessage($event)" src="{{org.coverImage}}" width="260">
			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgDetailsComponent implements OnInit {
	@Input() org;
	@Output() update = new EventEmitter();

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

}