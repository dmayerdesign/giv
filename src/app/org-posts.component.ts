import { Component, OnInit, AfterViewInit, AfterContentInit, OnDestroy, Input, Output, ViewChildren, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { TruncatePipe } from './pipes/truncate.pipe';
import 'rxjs/add/operator/map';

@Component({
	selector: 'org-posts',
	templateUrl: 'app/org-posts.component.html',
	styleUrls: ['app/org-posts.component.css', 'app/org.styles.css']
})

export class OrgPostsComponent implements OnInit {
	@Input() org;
	@Input() user;
	@Input() isBrowsing:boolean;
	@Output() update = new EventEmitter();
	@Output() tabChange = new EventEmitter();
	@ViewChildren('singlePost') $posts = [];

	private posts:Array<any> = [];
	private postsShowing:number;
	private initialPostLimit:number = 30;
	private savingPost:boolean = false;
	private selectedPost:any = null;
	private viewingOne:boolean = false;
	public postId:Observable<string>;
	private querySub:Subscription;
	private orgsByPost = {};
	private adminToken:string;

	private searchText:string;
	private searchBoxIsFocused:boolean = false;
	private searchPlaceholder:string;

	private isLoading = true;
	private loadingPosts:boolean = false;
	private options = new RequestOptions({ headers: new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' }) });

	private isEditing:boolean = false;
	private creatingPost:boolean = false;

	constructor(
				private router: Router,
				private route: ActivatedRoute,
				private http: Http,
				private orgService: OrgService,
				private ui: UIHelper,
				private utilities: Utilities) {
	}

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
		this.searchPlaceholder = (this.org && this.org._id) ? 'posts by ' + this.org.name : 'posts';
		this.loadPosts(null, 0, 0, data => {
			this.posts = data;
			this.querySub = this.route.queryParams.subscribe(params => {
				if (params['viewpost']) {
					this.selectPost(params['viewpost']);
					window.setTimeout(() => { window.location.href += "#posts" }, 500);
				}
			});
		});
	}

	ngOnDestroy() {
		if (this.querySub) this.querySub.unsubscribe();
	}

	loadPosts(search?:string, increase?:number, offset?:number, next?) {
		this.loadingPosts = true;
		let query = {};
		if (increase) query['limit'] = increase;
		if (offset) query['offset'] = offset;

		if (!this.org) query = {limit: this.initialPostLimit, sort: "-createdAt"}
		if (this.org) query = {filterField: "org", filterValue: this.org._id, limit: this.initialPostLimit, sort: "-createdAt"};
		if (this.org && this.isBrowsing) query['limit'] = 4;

		if (search) {
			query['search'] = search;
			query['field'] = "title";
			query['bodyField'] = "content";
		}

		console.log("query: ", query);

		this.orgService.loadPosts(query).subscribe(
			data => {
				this.posts = data;
				this.loadingPosts = false;
				this.isLoading = false;
				
				this.takeCount(this.posts);
				if (!this.org) this.getOrgAvatarsByPost();

				this.update.emit("init");

				next(data);
			},
			error => {
				console.log(error)
				this.isLoading = false;
			}
		);
	}

	selectPost(id:any) {
		console.log(id);
		console.log(this.isBrowsing);

		if (!this.posts.length) return;

		if (this.isBrowsing) {
			this.router.navigate(['/organization', 'i', this.posts.find(post => {
				return post._id === id;
			}).org], {queryParams: { viewpost: id } });
		}
		else {
			this.viewingOne = true;
			this.selectedPost = this.posts.find(post => post._id === id);
			if (!this.selectedPost) return this.ui.flash("Sorry, that post no longer exists :(", "error");
			this.selectedPost.treatedContent = this.treatContent(this.selectedPost.content);
		}
	}

	deselectPost() {
		this.viewingOne = false;
		this.selectedPost = null;
	}

	takeCount(children:any) {
		this.postsShowing = this.ui.takeCount(children);
	}

	searchPosts(search:string) {
		this.viewingOne = false;
		this.selectedPost = null;
		this.loadPosts(search, 0, 0, data => {
			this.searchText = search;
		});
	}

	showMore(increase:number, offset:number) {
		let search = (localStorage["searching"] == "true") ? this.searchText : "";
		this.loadPosts(search, increase, offset, data => {
			this.posts = this.posts.concat(data);
		});
	}

	toggleSearchBoxFocus(event:string) {
		if (event == 'focus') {
			this.searchBoxIsFocused = true;
		}
		if (event == 'blur') {
			this.searchBoxIsFocused = false;
		}
	}

	userHasPermission(org) {
		if (this.user && this.userIsAdmin()) return true;
		if (this.user && this.user.permissions.indexOf(org.globalPermission) > -1) return true;
		else return false;
	}

	getOrgAvatarsByPost() {
		let query: {
			getSome: boolean,
			ids: any
		} = {
			getSome: true,
			ids: []
		};
		let params: URLSearchParams = new URLSearchParams();
		params.set("getSome", "true");
		let i = 0;
		while (i < this.posts.length) {
			query.ids.push(this.posts[i].org);
			i++;
		}
		params.set("ids", query.ids.join(","));
		console.log(query);
		this.http.get("/orgs/get", {search: params}).map(res => res.json()).subscribe(orgs => {
			console.log("Post orgs", orgs);
			this.posts.forEach(post => {
				let owner = orgs.find((org) => {
					return org._id === post.org;
				});
				this.orgsByPost[post._id] = owner;
			});
		}, err => {
			console.error(err);
		});
	}

	editPost() {
		if (this.userHasPermission(this.org)) this.isEditing = true;
		else this.ui.flash("Sorry, you don't have permission to do that", "error");
	}

	savePost(post) {
		if (post && this.isEditing) {
			this.orgService.editPost(post).subscribe(
				post => {
					this.ui.flash("Saved", "success");
					this.selectedPost = post;
					this.selectedPost.treatedContent = this.treatContent(this.selectedPost.content);
					this.isEditing = false;
				},
				error => {
					console.error(error);
					this.ui.flash("Couldn't edit your post", "error");
					this.isEditing = false;
				});
		}
	}

	cancelPost() {
		this.isEditing = false;
	}

	deletePost(post):void {
		if (window.confirm("Are you sure you want to delete this post? This can't be undone.")) {
			this.http.delete('/post/' + post._id).map(res => res.json()).subscribe(res => {
				if (res.errmsg) {
	  			this.ui.flash("Delete failed", "error");
	  			return;
	  		}
	  		this.posts.splice(this.posts.indexOf(post), 1);
	  		this.org.posts.splice(this.org.posts.indexOf(post._id), 1);
	  		this.update.emit(this.org);
	  		this.viewingOne = false;
	  		this.selectedPost = null;
	  		this.ui.flash("Deleted", "info");
			}, error => {
				this.ui.flash("Delete failed", "error");
	  		return;
			});
		}
	}

	createPost(newPost):void {
  	this.savingPost = true;
  	this.http.post('/post', newPost).map(res => res.json()).subscribe(res => {
  		if (res.errmsg) {
  			this.ui.flash("Save failed", "error");
  			this.savingPost = false;
  			return;
  		}
  		this.posts.unshift(res);
  		this.org.posts.push(res._id);
  		this.update.emit(this.org);
  		this.savingPost = false;
  		this.creatingPost = false;
  		
  		this.ui.flash("Saved", "success");
  		console.log(res);
  	});
  }

	showOrgs() {
		this.tabChange.emit("");
	}

	treatContent(content):string {
		if (!content || typeof content === "undefined") return "";

		content = content.replace(/(?:\r\n|\r|\n)/g, '<br />');
		let url = content.match(/(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/);
		if (url) {
    	url = url[0];
    } else {
    	return content;
    }
    let shortenedUrl = (url.length > 80) ? url.slice(0, 40) + "..." : url;
    console.log("URL:", url);
    return content.replace(url, "<a href='" + url + "' target='_blank'>" + shortenedUrl + "</a>");
	}

	tooFewPosts() {
		if (this.posts) return this.posts.length >= this.initialPostLimit;
		else return true;
	}

	userIsAdmin() {
  	return this.user.adminToken === this.adminToken;
  }

  toggleCreatingPost(b:boolean) {
  	if (b) this.creatingPost = b;
  	else this.creatingPost = this.creatingPost ? false : true;
  }

}