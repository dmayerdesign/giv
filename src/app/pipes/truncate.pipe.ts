import { Pipe } from '@angular/core'

@Pipe({
  name: 'truncate'
})
export class TruncatePipe {
  transform(value:string, arg1:any, arg2:any):string {
  	if (value && arg1 !== 0) {
	    let limit:number = arg1 ? parseInt(arg1, 10) : 200;
	    let trail:string = arg2 || '...';
	    return value.length > limit ? value.substring(0, limit) + trail : value;
	  }
	  else return value;
  }
}