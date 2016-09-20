import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';

@Injectable()
export class SearchService {
  constructor (private http:Http) { }

  loadSearchableData(uri:string, options) { //search?:string, field?:string, org?:string, limit?:number, offset?:number) {
    let params: URLSearchParams = new URLSearchParams();

    if (this.stringIsSet(options.search)) {
      params.set("search", options.search);
      localStorage.setItem("searching", "true");
    } else {
      localStorage.setItem("searching", "false");
    }

    if (this.stringIsSet(options.org)) params.set("org", options.org);
    if (this.stringIsSet(options.field)) params.set("field", options.field);
    if (this.numberIsSet(options.limit)) params.set("limit", options.limit.toString());
    if (this.numberIsSet(options.offset)) params.set("offset", options.offset.toString());

    return this.http.get(uri, {
      search: params,
    }).map(res => res.json());
  }

  stringIsSet(option):boolean {
    return typeof option === "string" && option.length > 0;
  }
  numberIsSet(option):boolean {
    return typeof option === "number" && option > 0;
  }
}