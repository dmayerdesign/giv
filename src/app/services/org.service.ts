import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { SearchService } from './search.service';

interface EditOrgInterface {
		id?: string;
    key?: string;
   	value?: string;
}

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

	editOrg(options: EditOrgInterface) {
		return this.http.post("/edit-org/" + options.key + "/" + options.id, {value: options.value}).map(res => res.json());
	}

}