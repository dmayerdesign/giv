import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';

@Component({
	selector: 'starred-orgs',
	templateUrl: 'app/starred-orgs.component.html',
	providers: [OrgService, UserService]
})

export class StarredOrgsComponent implements OnInit {
	private user:any;
	private orgs = [];

	constructor(private userService:UserService,
							private orgService:OrgService) { }

	ngOnInit() {
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			this.user = user;
			console.log(this.user.starred);
			this.loadStarredOrgs(this.user.starred);
		});
	}

	loadStarredOrgs(starred:any) {
		this.orgService.loadStarredOrgs(starred)
			.subscribe(
				results => {
					this.orgs = results;
					console.log("Starred orgs: ", this.orgs);
				},
				error => console.error(error)
		);
	}

}
