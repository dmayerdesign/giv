import { Component, OnInit, AfterContentInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';

@Component({
	selector: 'org-details',
	templateUrl: 'app/org-details.component.html',
	styleUrls: [ 'app/org-details.component.css', 'app/org.styles.css' ]
})

export class OrgDetailsComponent implements OnInit {
	@Input() org;
	@Input() isSingle;
	@Output() update = new EventEmitter();
	private coverImageLinkBroken:boolean = false;
	private shortDescriptionLength = 450;
	private truncateDescription:number = this.shortDescriptionLength;
	private originalDescriptionLength:number;
	private facebookLink:SafeResourceUrl;

	constructor(
				private http: Http,
				private orgService: OrgService,
				private helper: UIHelper,
				private utilities: Utilities,
				private sanitizer: DomSanitizer) { }

	ngOnInit() {
		
	}

	ngAfterContentInit() {
		this.update.emit("init");
		if (this.org.description) {
			this.originalDescriptionLength = this.org.description.length;
			this.org.description = this.org.description.replace(/(?:\r\n|\r|\n)/g, '<br />');
		}
		this.org.facebook = encodeURI(this.org.facebook);
		this.facebookLink = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.facebook.com/plugins/page.php?href=${this.org.facebook}&tabs=timeline&width=340&height=290&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=true&appId=146608639126993`);
	}

	ngOnDestroy() {
		this.update.emit("destroy");
	}

	badLink($event) {
		this.coverImageLinkBroken = true;
	}

	goodLink() {
		this.coverImageLinkBroken = false;
	}

	hasCoverImage():boolean {
		if (this.org.coverImage
				&& this.org.coverImage.length) { return true; }
		else if (!this.org.coverImage
				|| !this.org.coverImage.length) { return false; }
	}

	descriptionIsLong() {
		if (this.org.description && (this.originalDescriptionLength > this.truncateDescription)) return true;
		else return false;
	}

	readMore() {
		this.truncateDescription = 0;
	}

	readLess() {
		this.truncateDescription = this.shortDescriptionLength;
	}

	showReadMore() {
		return this.truncateDescription !== 0 && this.originalDescriptionLength > this.truncateDescription;
	}

	showReadLess() {
		return this.truncateDescription == 0 && this.originalDescriptionLength > this.truncateDescription;
	}

}