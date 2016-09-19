import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { SearchService } from './search.service';

@Injectable()
export class OrgService {

	constructor(
		private http:Http,
		private search:SearchService) {	}

	loadOrgs(options) {
		return this.search.loadSearchableData("/orgs/get", options);
	}

	loadOrg(id) {
		return this.http.get("/org/" + id).map(res => res.json());
	}

}