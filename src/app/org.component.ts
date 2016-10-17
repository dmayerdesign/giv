import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { ActivatedRoute } from '@angular/router';

import { UIHelper } from './services/app.service';
import { OrgDetailsComponent } from './org-details.component';
import { OrgPostsComponent } from './org-posts.component';
import { TruncatePipe } from './pipes/truncate.pipe';

@Component({
	selector: 'org',
	templateUrl: 'app/org.component.html',
	styleUrls: [ 'app/org.styles.css', 'app/org.component.css' ]
})

export class OrgComponent implements OnInit {
	@Input() user;
	@Input() org;
	@Output() onSelect = new EventEmitter();
	@Output() onDeselect = new EventEmitter();
	@Output() onStar = new EventEmitter();
	@Output() onUnstar = new EventEmitter();

	private viewingOrg:boolean = false;
	private singleDetailsAreLoaded:boolean = false;
	private singlePostsAreLoaded:boolean = false;
	private adminToken:string;
	private shortDescription:string;

	constructor(
				private http:Http,
				private route:ActivatedRoute,
				private ui:UIHelper) { }

	ngOnInit() {
		this.http.get("/adminToken").map(res => res.json()).subscribe(
			data => {
				this.adminToken = data;
			},
			err => {
				console.error(err);
			}
		);
	}

	ngAfterViewInit() {
		this.shortDescription = this.org.description.replace("<br />", " ");
	}

	viewOrg():void {
		this.onSelect.emit(this.org._id);
		this.viewingOrg = true;
	}

	deselectOrg(e:any):void {
		if (e.target.className.indexOf("inside-org") > -1) return;
		if (this.viewingOrg) {
			this.onDeselect.emit(this.org._id);
			this.viewingOrg = false;
			this.singleDetailsAreLoaded = false;
			this.singlePostsAreLoaded = false;
		}
	}

	orgIsStarred() {
		if (!this.user || this.user.starred.indexOf(this.org._id) === -1) return false;
		else return true;
	}

	starOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
		this.http.put("/user/star/add", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.stars = this.org.stars ? this.org.stars+1 : 1;
				this.onStar.emit(org._id);
			}
		);
	}

	unstarOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
		this.http.put("/user/star/subtract", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.stars = this.org.stars ? this.org.stars-1 : 0;
				this.onUnstar.emit(org._id);
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
		if (this.user && this.userIsAdmin()) return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

}