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
	    { name: "Feminism", id: "feminism" },
	    { name: "Reproductive rights", id: "reproductive" },
	    { name: "Immigration and refugee rights", id: "immigration" },
	    { name: "Healthcare", id: "healthcare" },
	    { name: "Economic justice", id: "economic" },
	    { name: "Anti-colonialism", id: "anticolonialism" },
	    { name: "Human rights", id: "human" },
	    { name: "Education", id: "education" },
	    { name: "Philanthropy & Community", id: "philanthropy" },
	    { name: "Media", id: "media" },
	    { name: "Other", id: "other" }
	  ];
	}
}