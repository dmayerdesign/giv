import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core';

@Component({
	selector: 'search-box',
	template: `
		<div class="search-box">
			<input type="text"
					(keydown)="submitSearch($event)"
					(keyup)="checkEmpty($event); updateSearch($event)"
					(focus)="focusChange.emit('focus')"
					(blur)="focusChange.emit('blur')"
					placeholder='Search {{collection}}'>
			<div class="search-button" (click)="submitSearch($event)"></div>
		</div>`,
	styleUrls: ['app/search-box.component.css']
})
export class SearchBox {
	@Output() update = new EventEmitter();
	@Output() focusChange = new EventEmitter();
	@Input() collection:string;
	private search:string;

	constructor(private el:ElementRef) {
	}

	submitSearch($event) {
		let search:string = this.search;
		let keyCode:number = $event.keyCode;

		if (!search || typeof search === "undefined") return;

		if (search.length <= 1 && keyCode === 8) {
			this.update.emit("");
		}

		if (keyCode === 13 || $event.target.className.indexOf("search-button") > -1) {
			this.update.emit(search);
			this.el.nativeElement.querySelectorAll(".search-box input")[0].blur();
		}
	}

	updateSearch($event) {
		this.search = $event.target.value;
	}

	checkEmpty($event) {
		let search:string = $event.target.value;
		if (!search || search === "") {
			this.update.emit("");
		}
	}
}