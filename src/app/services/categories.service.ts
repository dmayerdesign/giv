import { Injectable } from '@angular/core';

@Injectable()
export class Categories {

	constructor() { }

	list():any {
		return [
			{ name: "Civil rights", id: "civil" },
	    { name: "Racial justice", id: "racial" },
			{ name: "Criminal justice", id: "criminal" },
	    { name: "LGBTQIA justice", id: "lgbtqia" },
	    { name: "Disability rights", id: "disability" },
	    { name: "Neurodiversity", id: "neurodiversity" },
	    { name: "Environmental justice", id: "environmental" },
	    { name: "Women's issues", id: "women" },
	    { name: "Reproductive rights", id: "reproductive" },
	    { name: "Immigration and refugee rights", id: "immigration" },
	    { name: "Healthcare", id: "healthcare" },
	    { name: "Economic justice", id: "economic" },
	    { name: "Other", id: "other" }
	  ];
	}
}