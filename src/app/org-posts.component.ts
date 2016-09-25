import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, ViewChildren } from '@angular/core';
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

export class OrgPostsComponent {
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
	private searchPlaceholder:string;

	private isLoading = true;
	private loadingPosts:boolean = false;
	private options = new RequestOptions({ headers: new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' }) });


	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities) {
	}

	ngAfterViewInit() {
		this.searchPlaceholder = (this.org && this.org._id) ? 'posts by ' + this.org.name : 'posts';
		this.loadPosts();
	}

	ngOnDestroy() {
		this.querySub.unsubscribe();
	}

	loadPosts() {
		let orgIds:any = null;
		let query:any = function():any {
			if (this.org) return {filterField: "org", filterValue: this.org._id, limit: 20};
			else return {limit: 20, sort: "-likes"};
		};

		this.orgService.loadPosts(query).subscribe(
			data => {
				console.log("data");
				console.log(data);
				this.isLoading = false;
				this.posts = data;
				this.takeCount(this.posts);

				this.querySub = this.route.queryParams.subscribe(params => {
					if (params['viewpost']) {
						this.selectPost(params['viewpost']);
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
		console.log(id);
		console.log(this.isBrowsing);
		if (!this.isBrowsing) {
			this.viewingOne = true;
			this.selectedPost = this.posts.find(post => post._id === id);
		}
		else {
			this.router.navigate(['/organization/i', this.posts.find(post => post._id === id).org], {queryParams: { viewpost: id } });
		}
	}

	deselectPost() {
		this.viewingOne = false;
		this.selectedPost = null;
	}

	takeCount(children:any) {
		this.postsShowing = this.helper.takeCount(children);
	}

	searchPosts(search:string) {
		let query = {search: search, field: "title", bodyField: "content", limit: 20};
		
		if (this.org && this.org._id) {
			query['filterField'] = "org";
			query['filterValue'] = this.org._id;
		}
		this.loadingPosts = true;
		this.orgService.loadPosts(query)
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