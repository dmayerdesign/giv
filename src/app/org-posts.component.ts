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
	templateUrl: 'app/org-posts.component.html',
	providers: [OrgService, UIHelper, Utilities]
})

export class OrgPostsComponent implements OnInit {
	@Input() org;
	@Input() user;
	@Input() isBrowsing:boolean;
	@ViewChildren('singlePost') $posts = [];

	private posts = [];
	private postsShowing:number;
	private selectedPost:any = null;
	private viewingOne:boolean = false;
	//private isPermalink:boolean = false;
	public postId:Observable<string>;
	private querySub:Subscription;

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
		console.log(this.org);
		this.loadPosts();
	}

	ngOnDestroy() {
		this.querySub.unsubscribe();
	}

	loadPosts() {
		this.orgService.loadPosts({filterField: "org", filterValue: this.org._id, limit:10}).subscribe(
			data => {
				console.log("data");
				console.log(data);
				this.isLoading = false;
				this.posts = data;
				this.takeCount(this.posts);

				this.querySub = this.route.queryParams.subscribe(params => {
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

	updatePosts(org) {
		this.loadPosts();
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