import { Component, OnInit, Input, Output } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'org-posts',
	template: `
			<div class="posts-by-org">
				<h4>What they're up to</h4>
				<h5 *ngFor="let post of posts">{{post}}</h5>
			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgPostsComponent implements OnInit {
	@Input() org;

	private posts = [];

	constructor(
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) { }

	ngOnInit() {
		this.posts = [
			"Ayyyyyy",
			"Ohhhhh",
			"Whuuuuut"
		];
	}

}