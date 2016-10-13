import { Injectable } from '@angular/core';

@Injectable()
export class Categories {

	constructor() { }

	list():any {
		return [
			{ name: "Civil rights", id: "civil" },
	    { name: "Racial justice", id: "racial" },
	    { name: "LGBTQIA justice", id: "lgbtqia" },
	    { name: "Environmental justice", id: "environmental" },
	    { name: "Reproductive rights", id: "reproductive" },
	    { name: "Healthcare advocacy", id: "healthcare" },
	    { name: "Economic justice", id: "economic" },
	    { name: "Other", id: "other" }
	  ];
	}
}