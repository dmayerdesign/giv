export class FormField {
	element:string = "input"; // input, textarea
	type:string = "text"; // url, text, email, password
	title:string; // Cover image
	name:string; // coverImage
	model:string; // coverImageLink
	placeholder:string; // Paste a link to an image
	uploadModel:any = null; // org.coverImage
}