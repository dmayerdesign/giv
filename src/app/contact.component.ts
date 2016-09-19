import { Component } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Router } from '@angular/router';
import { InfoMessage } from './services/app.service';
import { EmailModel } from './services/email.service';

@Component({
	selector: 'contact',
	templateUrl: 'app/contact.component.html'
})

export class ContactComponent {
	private inputs = new EmailModel();
	private infoMsg = new InfoMessage();

	constructor(private http:Http,
							private router:Router) { }

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
					alert('no errors!');
					console.log(data);
					this.router.navigate([data.redirectTo + JSON.stringify(data)]);
				},
				err => {
					console.log(err);
					alert('not sent!');
				});
	}

	sendInfoMsg(body, type, time = 3000) {
		this.infoMsg.body = body;
		this.infoMsg.type = type;
		window.setTimeout(() => this.infoMsg.body = "", time);
	}

}