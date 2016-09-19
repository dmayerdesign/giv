import { Pipe, PipeTransform } from '@angular/core';
import { UIHelper, Utilities } from '../services/app.service';

@Pipe({
  name: 'age',
  pure: false
})
export class AgePipe implements PipeTransform {
	private $cats = [];
  transform(cats, [config = ["older than", 10]]):any {

    if (!Array.isArray(cats)) {
      return null;
    }

    switch (config[0]) {
      case "older than":
        this.$cats = cats.filter(cat => cat.age > config[1]);
        break;
      case "younger than":
        this.$cats = cats.filter(cat => cat.age < config[1]);
        break;
      case "exactly":
        this.$cats = cats.filter(cat => cat.age == config[1]);
        break;
      default:
        this.$cats = cats;
    }

    return this.$cats;
  }
}