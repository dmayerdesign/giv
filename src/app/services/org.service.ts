import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { SearchService } from './search.service';

interface EditInterface {
		id?: string;
    key?: string;
   	value?: any;
}

@Injectable()
export class OrgService {

	constructor(
		private http:Http,
		private search:SearchService) { }

	loadOrgs(options) {
		return this.search.loadSearchableData("/orgs/get", options);
	}

	loadUnverifiedOrgs(options) {
		return this.search.loadSearchableData("/orgs/unverified/get", options);
	}

	loadStarredOrgs(starred) {
		let params: URLSearchParams = new URLSearchParams();
		params.set("starred", starred.join(","));
		return this.http.get("/orgs/get/starred", { search: params }).map(res => res.json());
	}

	loadPosts(options) {
		return this.search.loadSearchableData("/posts/get", options);
	}

	loadOrg(options:any) {
		if (options instanceof Object) {
			if (options.slug) return this.http.get("/org/s/" + options.slug).map(res => res.json());
			if (options.id) return this.http.get("/org/" + options.id).map(res => res.json());
		}
		else {
			return this.http.get("/org/" + options).map(res => res.json());
		}
	}

	editOrg(options: EditInterface) {
		return this.http.put("/edit-org/" + options.key + "/" + options.id, {value: options.value}).map(res => res.json());
	}

	editPost(options: EditInterface) {
		return this.http.put("/edit-post/" + options.key + "/" + options.id, {value: options.value}).map(res => res.json());
	}
}