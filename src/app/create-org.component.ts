import { Component, OnInit, AfterViewChecked, Input } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';
import { Categories } from './services/categories.service';
import { OrgTypes } from './services/org-types.service';
import { UIHelper } from './services/app.service';
import { HtmlEmailModel } from './services/email.service';

interface org {
	name: string,
	description: string,
	website: string,
	donateLink: string,
	categories: [any]
}

function Org():void {
	this.name = null;
	this.description = null;
	return this;
};

@Component({
	selector: 'create-org',
	templateUrl: 'app/create-org.component.html',
	styleUrls: ['app/manage-org-page.component.css', 'app/form-field.component.css', 'app/account-settings.component.css', 'app/create-org.component.css']
})

export class CreateOrgComponent implements OnInit {
	private user:any;
	private org = new Org();
	private email = new HtmlEmailModel();
	private categories = this.categoryService.list();
	private orgTypes = this.orgTypeService.list();
	private roleDescription:string;
	private requiredOrgFields = [
		{
			id: "name",
			name: "name"
		},
		{
			id: "description",
			name: "description"
		},
		{
			id: "donateLink",
			name: "donate link"
		},
		{
			id: "website",
			name: "website"
		}
	];

	/** Name validation **/
	private nameIsValid:boolean = true;

	constructor(
				private orgService:OrgService,
				private userService:UserService,
				private ui:UIHelper,
				private http:Http,
				private router:Router,
				private categoryService:Categories,
				private orgTypeService:OrgTypes) { }

	ngOnInit() {
		this.ui.setTitle("Add your organization");
		this.userService.getLoggedInUser((err, user) => {
			if (err) {
				console.error(err);
				this.router.navigate(['/']);
				return this.ui.flash("Sorry--an error occurred", "error");
			}
			if (user) {
				this.user = user;
				this.email = {
					subject: "A new organization was submitted!",
					html: null,
					toAddr: "d.a.mayer92@gmail.com",
					toName: "Danny at GIV",
					fromAddr: this.user.email,
					fromName: this.user.name || this.user.email,
					redirectTo: null
				}
			} else {
				this.router.navigate(['/']);
				this.ui.flash("Sorry! You need to be logged in to create an organization", "error");
			}
		});

		this.org.verified = false;
	}

	orgHasCategory(category) {
		if (this.org.categories) {
	  	let categoryInOrg = this.org.categories.filter((orgCategory) => {
	  		return orgCategory.id === category.id;
	  	});
	  	if (categoryInOrg.length) return true;
	  	else return false;
	  }
	  else return false;
  }

  changeSelectedCategories(category, add) {
  	if (!this.org.categories) this.org['categories'] = []; // for old orgs without categories array already
  	if (add) {
  		this.org.categories.push(category);
  	} 
  	else {
	  	this.org.categories.splice(this.org.categories.indexOf(category), 1);
	  }
  }

  checkForUniqueName(name) {
  	this.http.get("/org/name/" + name).map(res => res.json()).subscribe(data => {
  		if (data) {
  			this.nameIsValid = false;
  			this.ui.flash("Sorry, that name is taken", "error");
  		}
  		else this.nameIsValid = true;
  	});
  }

  submitOrg(newOrg:org):void {
  	let ok:boolean = true;
    this.requiredOrgFields.forEach((field, index, arr) => {
    	if (!newOrg[field.id] && field.id !== 'type') {
    		this.ui.flash("Oops! You need to fill out your org's " + field.name, "error");
    		ok = false;
    	}
    });
    if (!ok) return;
    if (!this.roleDescription) return this.ui.flash("Oops! You need to describe your role in the organization", "error");
    if (!this.nameIsValid) return this.ui.flash("Oops! That name is taken", "error");

    let categories:string = "";
    newOrg.categories.forEach((category, index, arr) => {
    	if (category.name !== "undefined") categories += category.name;
    	if (index !== (arr.length - 1)) categories += ", ";
    });
    this.email.html = `
    <!doctype html>
    <html>
    <body>
    	<p><strong>Organization:</strong> ${newOrg.name}</p>
    	<p><strong>Submitted by:</strong> ${this.email.fromName}</p>
    	<p><strong>Role:</strong> ${this.roleDescription}</p>
    	<p><strong>Description of organization:</strong> ${newOrg.description}</p>
    	<p><strong>Categories:</strong> ${categories}</p>
    	<p><strong>Website:</strong> ${newOrg.website}</p>
    	<p><strong>Donate link:</strong> ${newOrg.donateLink}</p>
    </body>
    </html>`;

  	this.http.post('/org', newOrg).map(res => res.json()).subscribe(res => {
  		console.log("New org: ", res);
  		if (res.errmsg) {
  			this.ui.flash("Submission failed. It's possible that an org with the same name already exists.", "error");
  			return;
  		}
  		this.org = res;
  		console.log(res);

  		this.http.post('/contact-form', this.email)
  			.map((res) => res.json())
				.subscribe(
					data => {
						if (data.errmsg) {
							console.error(data.errmsg);
							return this.ui.flash("Couldn't send your message", "error");
						}
						this.ui.flash("Submitted! We'll be in touch with you soon. Thanks!", "success");
						console.log(data);
						this.router.navigate(['/']);
					},
					err => {
						console.log(err);
						this.ui.flash("Couldn't send your message", "error");
					});
  	}, error => {
  		this.ui.flash("Submission failed", "error");
  		return console.error(error);
  	});
  }

}