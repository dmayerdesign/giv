import { Injectable } from '@angular/core';

@Injectable()
export class Categories {

	constructor() { }

	list():any {
		return [
	    { name: "Racial Justice", id: "racial" },
	    { name: "LGBTQIA Justice", id: "lgbtqia" },
	    { name: "Environmental Justice", id: "environmental" },
	    { name: "Reproductive Rights", id: "reproductive" },
	    { name: "Economic Justice", id: "economic" },
	    { name: "Other", id: "other" }
	  ];
	}
}