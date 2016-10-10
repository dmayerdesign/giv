import { Component, Input, OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { UIHelper } from './services/app.service';
import { HtmlEmailModel } from './services/email.service';
import { Subscription } from 'rxjs/Subscription';
import { OrgService } from './services/org.service';
import { UserService } from './services/user.service';

@Component({
	selector: 'claim-org',
	templateUrl: 'app/claim-org.component.html'
})

export class ClaimOrgComponent implements OnInit {
	@Input() org:any; // Declared as an input in case you're including it inside another component like <manage-org-page [org]="org"></...>
	private sub:Subscription;
	private isLoaded:boolean = false;
	private inputs = new HtmlEmailModel();
	private message:string;
	private user:any;

	constructor(private http:Http,
							private router:Router,
							private route:ActivatedRoute,
							private ui:UIHelper,
							private orgService:OrgService,
							private userService:UserService) { }


	ngOnInit() {
		this.ui.setTitle("GIV | Claim an organization");
		this.userService.getLoggedInUser((err, user) => {
			if (err) console.error(err);
			if (!user || err) {
				this.ui.flash("You have to be logged in to do that!", "error");
				return this.router.navigate(['/']);
			}
			this.user = user;
			if (this.route.params) {
				this.sub = this.route.params.subscribe(params => {
					let id = params['id'];
					if (id.length !== 24 || id.match(/[^a-z0-9]/)) {
						this.ui.flash("This page doesn't exist", "error");
						return this.router.navigate([''], { queryParams: {"404": true}});
					}

					this.orgService.loadOrg(id).subscribe(
						data => {
							this.org = data;
							this.isLoaded = true;
						},
						err => {
							this.router.navigate([''], { queryParams: {"404": true}});
							console.log("Error: ");
							console.log(err);
							return console.error(err);
						}
					);
				});
			}
			else {
				this.router.navigate(['../']);
			}
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

	submitForm() {
		if (!this.org) {
			this.router.navigate(['/']);
			return this.ui.flash("There was an error finding the organization", "error");
		}

		this.inputs.subject = this.org.name + ' has been claimed by ' + this.inputs.fromName;
		this.inputs.redirectTo = '/';
		this.inputs.toName = 'Support';
		this.inputs.toAddr = 'd.a.mayer92@gmail.com';
		this.inputs.html = `
		<doctype html>
		<html>
		<body>
			<p><strong>User:</strong><br><pre>${this.user._id}</pre></p>
			<p><strong>Org:</strong><br><pre>${JSON.stringify(this.org)}</pre></p>
			<p><strong>Message:</strong><br>${this.message}</p>
		</body>
		</html>`;
		console.log(this.inputs);

		this.http.post('/contact-form', this.inputs)
			.map((res:Response) => res.json())
			.subscribe(
				data => {
					if (data.errmsg) {
						console.error(data.errmsg);
						return this.ui.flash("Sorry, your message couldn't be sent.", "error");
					}
					this.ui.flash("Sent!", "success");
					console.log(data);
					if (this.org.slug) this.router.navigate(['/organization', this.org.slug]);
					else this.router.navigate(['/organization', 'i', this.org._id]);
				},
				err => {
					console.log(err);
					this.ui.flash("Sorry, your message couldn't be sent.", "error");
				});
	}

}