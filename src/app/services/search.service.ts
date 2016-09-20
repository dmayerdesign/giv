import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';

@Injectable()
export class SearchService {
  constructor (private http:Http) { }

  loadSearchableData(uri:string, options) { //text?:string, limit?:number, offset?:number) {
    let params: URLSearchParams = new URLSearchParams();

    if (typeof options.org === "string" && options.org.length) {
      params.set("org", options.org);
    }

    if (typeof options.search === "string" && options.search.length) {
      params.set("search", options.search);
      localStorage.setItem("searching", "true");
    } else {
      localStorage.setItem("searching", "false");
    }
    if (typeof options.field === "string" && options.field.length) {
      params.set("field", options.field);
    }
    if (typeof options.limit === "number" && options.limit > 0) {
      params.set("limit", typeof options.limit === "number" && options.limit.toString());
    }
    if (typeof options.offset === "number" && options.offset > 0) {
      params.set("offset", (options.offset.toString()));
    }

    return this.http.get(uri, {
      search: params,
    }).map(res => res.json());
  }
}