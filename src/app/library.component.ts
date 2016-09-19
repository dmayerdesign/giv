import { Component } from '@angular/core';
import { UserService } from './services/user.service';

@Component({
	selector: 'library',
	templateUrl: 'app/library.component.html'
})

export class LibraryComponent {
	user = '';
}
