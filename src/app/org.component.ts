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
	@Input() selected;
	@Input() verify;
	@Output() onSelect = new EventEmitter();
	@Output() onDeselect = new EventEmitter();
	@Output() onFavorite = new EventEmitter();
	@Output() onUnfavorite = new EventEmitter();
	@Output() onVerify = new EventEmitter();

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
		this.selected = this.selected;
	}

	deselectOrg(e:any, orgId):void {
		if (!this.selected || orgId !== this.selected._id) return;
		if (e.target.className.indexOf("inside-org") > -1) return;
		if (this.selected && this.selected._id === orgId) {
			this.onDeselect.emit(this.org._id);
			this.selected = null;
			this.singleDetailsAreLoaded = false;
			this.singlePostsAreLoaded = false;
		}
	}

	orgIsFavorited() {
		if (!this.user || this.user.favorites.indexOf(this.org._id) === -1) return false;
		else return true;
	}

	favoriteOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
		this.http.put("/user/favorite/add", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.favorites = this.org.favorites ? this.org.favorites+1 : 1;
				this.onFavorite.emit(org._id);
			}
		);
	}

	unfavoriteOrg(org):void {
		if (!this.user) return this.ui.flash("Sign up or log in to save your favorite organizations", "info");
		this.http.put("/user/favorite/subtract", {orgId: org._id, userId: this.user._id}).map(res => res.json()).subscribe(
			data => {
				this.user = data.user;
				this.org.favorites = this.org.favorites ? this.org.favorites-1 : 0;
				this.onUnfavorite.emit(org._id);
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

  isSelected(orgId) {
  	if (!this.selected) return false;
  	if (this.selected._id === orgId) return true;
  	else return false;
  }

  verifyOrg(org) {
  	this.onVerify.emit("");
  }

}