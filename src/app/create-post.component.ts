import { Component, OnInit, AfterViewChecked, OnDestroy, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { UIHelper, Utilities } from './services/app.service';

interface post {
	authorId: string,
	title: string,
	content: string,
	org: string,
	featuredImage: string,
	imageBucket: string
}

function Post():void {
	this.authorId = null;
	this.title = null;
	this.content = null;
	this.org = null;
	this.featuredImage = null;
	this.imageBucket = Date.now().toString();

	return this;
};

@Component({
	selector: 'create-post',
	templateUrl: 'app/create-post.component.html',
	styleUrls: ['app/form-field.component.css', 'app/create-post.component.css']
})

export class CreatePostComponent implements OnInit {
	@Input() org;
	@Input() user;
	@Input() editing;
	@Output() postAdd = new EventEmitter();
	@Output() cancel = new EventEmitter();

	private stillWorking:boolean = false;
	private progress:number = 0;
	private savingPost:boolean = false;
	private post = new Post();
	private loadingImage:boolean;

	private uploadFile:any;
  private uploadOptions:Object;

	constructor(
				private router:Router,
				private route:ActivatedRoute,
				private orgService:OrgService,
				private userService:UserService,
				private ui:UIHelper,
				private utilities:Utilities,
				private zone:NgZone,
				private http:Http) { }

	ngOnInit() {
		this.post = {
			authorId: null,
			title: null,
			content: null,
			org: null,
			featuredImage: null,
			imageBucket: Date.now().toString()
		};
		// for ng-upload
		this.uploadOptions = {
		  url: '/post/upload/featuredImage/' + this.post.imageBucket,
		  filterExtensions: true,
		  calculateSpeed: true,
		  allowedExtensions: ['image/png', 'image/jpeg', 'image/gif']
		};
	}

	ngAfterViewChecked() {
		if (this.org && this.user && !this.post.org) {
			this.post.authorId = this.user._id;
			this.post.org = this.org._id;
			console.log(this.post);
		}
	}

  handleUpload(data:any):void {
  	this.zone.run(() => {
  		console.log(data);
  		this.progress = data.progress.percent;
  		this.stillWorking = true;

	    if (data.response && data.status !== 404) {
	    	if (data.response.indexOf("errmsg") > -1) return console.error(data.response);
	    	this.post.featuredImage = data.response;
	    	this.stillWorking = false;
	    	console.log(this.post);
	    }
    });
  }

  createPost(newPost:post):void {
  	let required = ["title", "content"];
		let invalid = false;
		required.forEach(field => {
			if (!newPost[field] || !newPost[field].length) {
				invalid = true;
				this.ui.flash("Oops! You need to fill out the " + field + " of your post", "error");
			}
		});
		if (invalid) return;
  	this.postAdd.emit(newPost);
  	if (!this.editing) this.post = new Post();
  }

  cancelPost() {
  	this.cancel.emit(false);
  }

}