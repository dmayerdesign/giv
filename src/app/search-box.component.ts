import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core';
import { Categories } from './services/categories.service';

@Component({
	selector: 'search-box',
	styleUrls: ['app/search-box.component.css'],
	template: `
		<div class="search-box">
			<input type="text" (keydown)="submitSearch($event)"
					(focus)="focusChange.emit('focus')"
					(blur)="focusChange.emit('blur')"
					placeholder='Search {{collection}}'>

			<select *ngIf="this.collection === 'organizations'"
					(change)="submitSearch($event, true)">
				<option value="">All categories</option>
				<option *ngFor="let category of catList" value="{{category}}">{{category}}</option>
			</select>
		</div>`
})
export class SearchBox {
	@Output() update = new EventEmitter();
	@Output() focusChange = new EventEmitter();
	@Input() collection: string;

	private catList = this.categories.list();

	constructor(private el:ElementRef, private categories:Categories) {
		console.log("List: ", this.categories);
	}

	submitSearch($event, categorySearch) {
		let search:string = $event.target.value;
		let keyCode:number = $event.keyCode;

		if (categorySearch) {
			return this.update.emit(search);
		}

		if (search.length <= 1 && keyCode === 8)
			this.update.emit("");

		if (keyCode === 13) {
			this.update.emit(search);
			this.el.nativeElement.querySelectorAll(".search-box-container input")[0].blur();
		}
	}
}