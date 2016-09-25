import { Injectable } from '@angular/core';

@Injectable()
export class Categories {

	constructor() { }

	list():any {
		return [
	    "Racial justice",
	    "Environmental justice",
	    "Reproductive rights",
	    "Economic justice",
	    "Other"
	  ];
	}
}