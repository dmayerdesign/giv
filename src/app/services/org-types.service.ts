import { Injectable } from '@angular/core';

@Injectable()
export class OrgTypes {

	constructor() { }

	list():any {
		return [
			"501(c)(3)",
			"501(c)(4)",
			"Co-operative",
			"Other"
	  ];
	}
}