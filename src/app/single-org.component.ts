import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, ROUTER_DIRECTIVES } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { UIHelper, Utilities } from './services/app.service';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
	selector: 'single-org',
	template: `
			<div class="single-org" *ngIf="isLoaded">
				<h4>{{org.name}}</h4>
				<org-details [org]="org" [isSingle]="true"></org-details>
								
				<a *ngIf="user && user.permissions.indexOf(org.globalPermission) > -1" href="/organization/manage/{{org?._id}}">Manage</a>

				<org-posts [org]="org" [user]="user"></org-posts>

			</div>`,
	styleUrls: [ 'app/org.styles.css' ],
	providers: [OrgService, UIHelper, Utilities],
	directives: [ROUTER_DIRECTIVES]
})

// Tell users to go to compressjpeg.com if their images exceed 2 MB

export class SingleOrgComponent implements OnInit {
	@Input() org;
	private user;
	private sub:Subscription;
	private isLoaded:boolean = false;

	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private orgService: OrgService,
				private userService: UserService,
				private helper: UIHelper,
				private utilities: Utilities,
				private zone: NgZone,
				private flash: FlashMessagesService) { }

	ngOnInit() {
		if (this.org) {
			this.isLoaded = true;
		}
		else {
			this.sub = this.route.params.subscribe(params => {
				let id = params['id'];
				let slug = params['slug'];

				this.orgService.loadOrg({id: id, slug: slug}).subscribe(
					data => {
						if (!data || !data._id) {
							this.flash.show("This page doesn't exist");
							return this.router.navigate([''], { queryParams: {"404": true}});
						}
						this.org = data;
						this.isLoaded = true;
					},
					error => {
						console.error(error);
						this.flash.show("This page doesn't exist");
						return this.router.navigate([''], { queryParams: {"404": true}});
					}
				);
			});
		}

		this.userService.getLoggedInUser((err, user) => {
			if(err) return console.error(err);
			this.user = user;
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

}