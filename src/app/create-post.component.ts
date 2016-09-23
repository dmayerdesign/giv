import { Component, OnInit, AfterViewChecked, OnDestroy, NgZone, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';

import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { UIHelper, Utilities } from './services/app.service';
import { FlashMessagesService } from 'angular2-flash-messages';

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
	providers: [OrgService, UserService, UIHelper, Utilities]
})

export class CreatePostComponent implements OnInit {
	@Input() org;
	@Input() user;
	@Output() update = new EventEmitter();
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
				private helper:UIHelper,
				private utilities:Utilities,
				private zone:NgZone,
				private flash:FlashMessagesService,
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
  	this.savingPost = true;
  	this.http.post('/post', newPost).map(res => res.json()).subscribe(res => {
  		console.log("New post: ", res);
  		if (res.errmsg) {
  			this.flash.show("Save failed", {cssClass: "error"});
  			this.savingPost = false;
  			return;
  		}
  		this.org = res;
  		this.update.emit(this.org);
  		this.savingPost = false;
  		this.post = new Post();
  		this.flash.show("Saved");
  		console.log(res);
  	});
  }

}