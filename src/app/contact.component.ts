import { Component, Input } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Router } from '@angular/router';
import { EmailModel, HtmlEmailModel } from './services/email.service';
import { UIHelper } from './services/app.service';

interface EmailForm {
	url: string,
	subject: string,
	outgoing: boolean,
	fields: {
		name?: boolean,
		email?: boolean,
		confirmEmail?: boolean,
		password?: boolean,
		confirmPassword?: boolean,
		message?: boolean
	},
	html?: string,
	fromAddr?: string,
	toAddr?: string,
	fromName?: string,
	toName?: string,
	callback?: any
}

@Component({
	selector: 'contact',
	templateUrl: 'app/contact.component.html'
})

export class ContactComponent {
	@Input() options:EmailForm;
	private inputs:any = {};

	constructor(private http:Http,
							private router:Router,
							private ui:UIHelper) {
		if (this.options && this.options.html && typeof this.options.html !== "undefined") this.inputs = new HtmlEmailModel();
		else this.inputs = new EmailModel();
	}

	submitForm() {
		this.inputs.subject = (this.options && this.options.subject) || 'Contact Form | GIV';
		this.inputs.redirectTo = '/';
		this.inputs.toName = this.inputs.toName || (this.options && this.options.toName) || 'Support';
		this.inputs.toAddr = this.inputs.toAddr || (this.options && this.options.toAddr) || 'd.a.mayer92@gmail.com';
		if (!this.inputs.fromName || typeof this.inputs.fromName === "undefined") this.inputs.fromName = this.options && this.options.fromName;
		if (!this.inputs.fromAddr || typeof this.inputs.fromAddr === "undefined") this.inputs.fromAddr = this.options && this.options.fromAddr;
		
		console.log(this.inputs);

		this.http.post((this.options && this.options.url) || '/contact-form', this.inputs).map((res:Response) => res.json())
			.subscribe(
				data => {
					if (this.options && this.options.callback) {
						return this.options.callback(null, data);
					}
					if (data.errmsg) {
						console.error(data.errmsg);
						return this.ui.flash("Couldn't send your message", "error");
					}
					this.ui.flash("Sent!", "success");
					console.log(data);
					this.router.navigate(['/']);
				},
				err => {
					console.log(err);
					if (this.options.callback) {
						return this.options.callback(err);
					}
					this.ui.flash("Couldn't send your message", "error");
				});
	}

}