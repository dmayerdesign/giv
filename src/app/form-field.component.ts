import { Component, OnInit, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'form-field',
	templateUrl: 'app/form-field.component.html'
})

export class FormFieldComponent implements OnInit {
	@Input() title;
	@Input() name;
	@Input() placeholder;
	@Input() type;
	@Input() saving;
	@Input() upload;
	@Input() selectOptions;

	@Output() onUpload = new EventEmitter();
	@Output() onChange = new EventEmitter();
	@Output() onSave = new EventEmitter();

	private value:any;
	private changed:boolean = false;

	private stillWorking:boolean = false;
	private progress:number = 0;
	private categories = this.categoryService.list();

	constructor(
				private ui:UIHelper,
				private utilities:Utilities,
				private categoryService:Categories,
				private zone:NgZone) { }

	ngOnInit() {

	}

  handleUpload(data:any):void {
  	this.zone.run(() => {
  		console.log(data);
  		this.progress = data.progress.percent;
  		this.stillWorking = true;

	    if (data.response && data.status !== 404) {
	    	this.onUpload.emit(JSON.parse(data.response));
	    }
    });
  }

  save():void {
  	this.onSave.emit(this.value);
  }

  changeHandler() {
  	if (this.value && this.value.length) this.changed = true;
  	else this.changed = false;
  }

}