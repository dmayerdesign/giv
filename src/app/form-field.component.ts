import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';

@Component({
	selector: 'form-field',
	templateUrl: 'app/form-field.component.html',
	styleUrls: ['app/form-field.component.css']
})

export class FormFieldComponent implements OnInit {
	@Input() initial;
	@Input() title;
	@Input() name;
	@Input() placeholder;
	@Input() type;
	@Input() saving;
	@Input() upload;
	@Input() selectOptions;
	@Input() noSave;

	@Output() onUpload = new EventEmitter();
	@Output() onSave = new EventEmitter();
	@Output() onChange = new EventEmitter();

	private value:any;
	private changed:boolean = false;
	private uploading:boolean = false;
	private progress:number = 0;

	constructor(
				private ui:UIHelper,
				private utilities:Utilities,
				private categoryService:Categories,
				private zone:NgZone) { }

	ngOnInit() {

	}

	ngAfterViewInit() {
		if (!this.type) this.type = "text";
		if (this.initial) {
			this.value = this.initial;
		}
	}

  handleUpload(data:any):void {
  	this.zone.run(() => {
  		console.log(data);
  		this.progress = data.progress.percent;
  		this.saving = true;
  		this.uploading = true;

	    if (data.response && data.status !== 404) {
	    	this.onUpload.emit(JSON.parse(data.response));
	    	this.saving = false;
	    	this.uploading = false;
	    	console.log(data.response);
	    }
    });
  }

  save(value?):void {
  	this.onSave.emit(value || this.value);
  	this.value = null;
  	this.zone.run(() => {
  		if (!this.saving) this.changed = false;
  	});
  }

  changeHandler() {
  	this.onChange.emit(this.value);

  	if (this.value && this.value.length) this.changed = true;
  	else this.changed = false;
  }

  isSelected(option):any {
  	if (option === this.initial) return "selected";
  	return null;
  }
}