import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core';

@Component({
	selector: 'search-box',
	styleUrls: ['app/search-box.component.css'],
	template: `
		<div class="search-box">
			<input type="text"
					(keydown)="submitSearch($event)"
					(keyup)="checkEmpty($event)"
					(focus)="focusChange.emit('focus')"
					(blur)="focusChange.emit('blur')"
					placeholder='Search {{collection}}'>
		</div>`
})
export class SearchBox {
	@Output() update = new EventEmitter();
	@Output() focusChange = new EventEmitter();
	@Input() collection: string;

	constructor(private el:ElementRef) {
	}

	submitSearch($event) {
		let search:string = $event.target.value;
		let keyCode:number = $event.keyCode;

		if (search.length <= 1 && keyCode === 8)
			this.update.emit("");

		if (keyCode === 13) {
			this.update.emit(search);
			this.el.nativeElement.querySelectorAll(".search-box-container input")[0].blur();
		}
	}

	checkEmpty($event) {
		let search:string = $event.target.value;
		if (!search || search === "") {
			this.update.emit("");
		}
	}
}