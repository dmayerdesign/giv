import { Component } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Router } from '@angular/router';
import { EmailModel } from './services/email.service';
import { UIHelper } from './services/app.service';

@Component({
	selector: 'contact',
	templateUrl: 'app/contact.component.html'
})

export class ContactComponent {
	private inputs = new EmailModel();

	constructor(private http:Http,
							private router:Router,
							private ui:UIHelper) { }

	submitForm() {
		this.inputs.subject = 'Contact Form | Fuse';
		this.inputs.redirectTo = '/';
		this.inputs.toName = 'Support';
		this.inputs.toAddr = 'd.a.mayer92@gmail.com';
		console.log(this.inputs);

		this.http.post('/contact-form', this.inputs)
			.map((res:Response) => res.json())
			.subscribe(
				data => {
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
					this.ui.flash("Couldn't send your message", "error");
				});
	}

}