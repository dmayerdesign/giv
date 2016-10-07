import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';

@Component({
	selector: 'starred-orgs',
	templateUrl: 'app/starred-orgs.component.html',
	styleUrls: ['app/browse-orgs.component.css', 'app/org.styles.css']
})

export class StarredOrgsComponent implements OnInit {
	private user:any;
	private orgs = [];
	private loadingShowMoreOrgs:boolean = false;
	private viewingOrg:boolean = false;
	private selectedOrg:any;
	private singleDetailsAreLoaded:boolean;
	private singlePostsAreLoaded:boolean;

	constructor(private userService:UserService,
							private orgService:OrgService,
							private http:Http) { }

	ngOnInit() {
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			this.user = user;
			console.log(this.user.starred);
			this.loadStarredOrgs(this.user.starred);
		});
	}

	loadStarredOrgs(starred:any, cb?:any) {
		this.orgService.loadStarredOrgs(starred)
			.subscribe(
				results => {
					this.orgs = results;
					console.log("Starred orgs: ", this.orgs);
				},
				error => console.error(error)
		);
	}

	viewOrg(e:any, id:string):void {
		let findOrg = function(org) {
			return org._id === id;
		}
		this.selectedOrg = this.orgs.find(findOrg);
		this.viewingOrg = true;
		console.log(this.selectedOrg);
	}

	deselectOrg(e:any, id:string):void {
		console.log(e.target.className);
		if (e.target.className.indexOf("inside-org") > -1) return;

		if (this.viewingOrg && this.selectedOrg._id === id) {
			console.log(this.selectedOrg);
			this.selectedOrg = null;
			this.viewingOrg = false;
			this.singleDetailsAreLoaded = false;
			this.singlePostsAreLoaded = false;
		}
	}

	orgIsStarred(org) {
		if (this.user.starred.indexOf(org._id) === -1) return false;
		else return true;
	}

	unstarOrg(org) {
		let orgIndex = this.orgs.indexOf(org);
		this.http.put("/user/star/subtract", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.orgs.splice(orgIndex, 1);
				console.log(data.org);
				console.log(data.user);
			}
		);
	}

	revealOrgDetails(event) {
		if (event == "init") {
			this.singleDetailsAreLoaded = true;
		}
	}

	revealOrgPosts(event) {
		if (event == "init") {
			this.singlePostsAreLoaded = true;
		}
	}

	userHasPermission(org) {
		if (this.user && this.user.adminToken === 'h2u81eg7wr3h9uijk8') return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

}
