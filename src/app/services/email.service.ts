import { Injectable } from '@angular/core';

export class EmailModel {
	subject: string;
	toAddr: string;
	toName: string;
	fromAddr: string;
	fromName: string;
	message: string;
	redirectTo: string;
}

export class HtmlEmailModel {
	subject: string;
	toAddr: string;
	toName: string;
	fromAddr: string;
	fromName: string;
	html: string;
	redirectTo: string;
}