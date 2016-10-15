interface options {
	value: string,
	text: string
}

export interface FormBlock {
	className: string,
	save: any,
	fields: Array<FormField>
}

export interface FormField {
	element: string; // input, textarea, select, checkbox
	type: string; // url, text, email, password
	model: string; // coverImageLink
	title?: string; // Cover image
	placeholder?: string; // Paste a link to an image
	upload?: boolean; // coverImage
	selectModel?: any; // donateLinkCopy
	selectOptions?: options[];
	checkboxOptions?: any[];
	customSave?: Function;
}