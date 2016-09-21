import { Component, OnInit, OnDestroy, Input, Output, ViewChildren } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Component({
	selector: 'org-posts',
	template: `
			<div class="posts-by-org" id="posts">
				<h4>What they're up to</h4>
				<search-box
					class="search-box-container col-md-8 col-md-offset-2 clearfix"
					*ngIf="!isBrowsing && !isLoading"
					(update)="searchPosts($event)"
					(focusChange)="toggleSearchBoxFocus($event)"
					[ngClass]="{focused: searchBoxIsFocused}"
					[collection]="'posts by' + org.name"></search-box>
				
				<div *ngIf="!viewingOne && !isLoading" class="posts">
					<div #singlePost *ngFor="let post of posts">
						<h5 *ngIf="isBrowsing"><a [routerLink]="['/organization/i', org?._id]" [queryParams]="{viewpost: post._id}">{{post.content}}</a></h5>
						<h5 *ngIf="!isBrowsing" (click)="selectPost(post._id)">{{post.content}}</h5>
					</div>
				</div>

				<div *ngIf="viewingOne && selectedPost">
					<a (click)="deselectPost()" [routerLink]="['/organization/i', org?._id]">Back to posts</a>
					<h5>{{selectedPost.content}}</h5>
				</div>

			</div>`,
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgPostsComponent implements OnInit {
	@Input() org;
	@Input() isBrowsing:boolean;
	@ViewChildren('singlePost') $posts = [];

	private posts = [];
	private postsShowing:number;
	private selectedPost:any = null;
	private viewingOne:boolean = false;
	//private isPermalink:boolean = false;
	public postId:Observable<string>;

	private searchText:string;
	private searchBoxIsFocused:boolean = false;

	private isLoading = true;
	private loadingPosts:boolean = false;
	private options = new RequestOptions({ headers: new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' }) });


	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) { }

	ngOnInit() {
		this.orgService.loadPosts({org: this.org._id, limit:10}).subscribe(
			data => {
				this.isLoading = false;
				this.posts = data;
				this.takeCount(this.posts);

				this.route.queryParams.subscribe(params => {
					if (params['viewpost']) {
						this.selectPost(params['viewpost']);
						//this.isPermalink = true;
						window.location.href += "#posts";
					}
				});
			},
			error => console.log(error)
		);
	}

	selectPost(id:any) {
		this.viewingOne = true;
		this.selectedPost = this.posts.find(post => post._id === id);
	}

	deselectPost() {
		this.viewingOne = false;
		this.selectedPost = null;
	}

	takeCount(children:any) {
		this.postsShowing = this.helper.takeCount(children);
	}

	searchPosts(search:string) {
		this.loadingPosts = true;
		this.orgService.loadPosts({org: this.org._id, search:search, field:"content", limit:10})
			.subscribe(
				results => {
					this.posts = results;
					this.loadingPosts = false;
					this.searchText = search;
				},
				error => console.error(error)
		);
	}

	showMore(increase:number, offset:number) {
		let search = (localStorage["searching"] == "true") ? this.searchText : "";

		this.orgService.loadOrgs({search: this.searchText, limit: increase, offset: offset}).subscribe(
			res => {
				this.isLoading = false;
				console.log(res);
				this.posts = this.posts.concat(res);
				this.takeCount(this.$posts);
			},
			error => console.log(error)
		);
	}

	toggleSearchBoxFocus(event:string) {
		if (event == 'focus') {
			this.searchBoxIsFocused = true;
		}
		if (event == 'blur') {
			this.searchBoxIsFocused = false;
		}
	}

}