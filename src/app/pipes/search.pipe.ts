import { Pipe } from '@angular/core';

@Pipe({
	name: "search",
	pure: false
})
export class SearchPipe {
	transform(arr, [field, term]){
		if (Array.isArray(arr)) {
			return arr.filter(item => item[field].toLowerCase().startsWith(term.toLowerCase()) );
		}
	}
}