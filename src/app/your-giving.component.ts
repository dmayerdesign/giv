import { Component, OnInit, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { Subscription } from 'rxjs/Subscription';

import { UserService } from './services/user.service';
import { OrgService } from './services/org.service';
import { Categories } from './services/categories.service';
import { UIHelper, Utilities } from './services/app.service';
import { CompleterService, CompleterData } from 'ng2-completer';

@Component({
	selector: 'your-giving',
	templateUrl: 'app/your-giving.component.html',
	styleUrls: ['app/form-field.component.css', 'app/your-giving.component.css']
})

export class YourGivingComponent implements OnInit {
	private user:any;
	private isLoaded:boolean = false;
	private stillWorking:boolean = false;
	private progress:number = 0;
	private donationType:string = "dollars";
	private dataService:CompleterData;
	private isLogging:boolean;
	private optionsMenus = {};

	private totalDollars:number = 0;
	private totalHours:number = 0;
	private largest:number;
	private donationsByOrg = [];

	/** Fields to edit **/
	private model = {
    orgId: null,
    orgName: null,
    userId: null,
    dollars: null,
    hours: null,
    memo: null
  };

	/** Saving **/
	private saving:boolean = false;

	constructor(
				private router:Router,
				private route:ActivatedRoute,
				private userService:UserService,
				private orgService:OrgService,
				private ui:UIHelper,
				private utilities:Utilities,
				private zone:NgZone,
				private http:Http,
				private categoryService:Categories,
				private completerService: CompleterService) {

		this.dataService = completerService.local(this.orgService.loadOrgs({}), 'name', 'name');
	}

	ngOnInit() {
		this.ui.setTitle("Your giving");
		this.userService.getLoggedInUser((err, user) => {
			if (err) return console.error(err);
			this.user = user;
			this.isLoaded = true;
      this.model.userId = this.user._id;

      this.updateData();
		});
	}

	updateData() {
		this.donationsByOrg = [];
		this.totalDollars = 0;
		this.totalHours = 0;

		this.user.donations.forEach(donation => {
    	let donationsToThisOrg = this.donationsByOrg.filter(d => {
    		return d.orgName === donation.orgName;
    	});
    	if (donationsToThisOrg.length) {
    		let index = this.donationsByOrg.findIndex(d => {
  				return d.orgName === donation.orgName;
  			});
    		if (donation.dollars) {
    			this.donationsByOrg[index].dollars += donation.dollars;
    			this.donationsByOrg[index].total += donation.dollars;
    		}
    		if (donation.hours) {
    			this.donationsByOrg[index].hours += donation.hours;
    			this.donationsByOrg[index].total += donation.hours;
    		}
    		if (donation.hours && donation.dollars) {
    			this.donationsByOrg[index].total += (donation.hours + donation.dollars);
    		}

    	}
    	else {
    		let newDonationToThisOrg = {
  				orgName: donation.orgName,
  				dollars: donation.dollars,
  				hours: donation.hours,
  				total: 0
  			}
  			if (donation.dollars) {
    			newDonationToThisOrg.total += donation.dollars;
    		}
    		if (donation.hours) {
    			newDonationToThisOrg.total += donation.hours;
    		}
    		if (donation.hours && donation.dollars) {
    			newDonationToThisOrg.total += (donation.hours + donation.dollars);
    		}
  			this.donationsByOrg.push(newDonationToThisOrg);
    	}

    	if (donation.dollars) this.totalDollars += donation.dollars;
    	if (donation.hours) this.totalHours += donation.hours;
    });

    this.donationsByOrg.sort((a, b) => {
    	if (a.dollars && a.hours && b.dollars && b.hours) {
    		if((a.dollars + a.hours) > (b.dollars + b.hours)) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.dollars && a.hours && b.dollars) {
    		if((a.dollars + a.hours) > b.dollars) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.dollars && a.hours && b.hours) {
    		if((a.dollars + a.hours) > b.hours) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.dollars && b.dollars && b.hours) {
    		if(a.dollars > (b.dollars + b.hours)) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.hours && b.dollars && b.hours) {
    		if(a.hours > (b.dollars + b.hours)) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.dollars && b.dollars) {
    		if(a.dollars > b.dollars) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.dollars && b.hours) {
    		if(a.dollars > b.hours) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.hours && b.dollars) {
    		if(a.hours > b.dollars) {
    			return -1;
    		}
    		else return 1;
    	}
    	else if (a.hours && b.hours) {
    		if(a.hours > b.hours) {
    			return -1;
    		}
    		else return 1;
    	}
    });

    this.largest = this.donationsByOrg[0].dollars || 0;
    if (this.donationsByOrg[0].hours) this.largest += this.donationsByOrg[0].hours;
	}

  updateModel(key:string, value:any) {
  	this.model[key] = value;
  }

  save():void {
  	if (!this.model.orgName) {
  		return this.ui.flash("Please choose an organization", "error");
  	}

  	if (this.donationType === "dollars") this.model.hours = null;
  	if (this.donationType === "hours") this.model.dollars = null;

  	this.saving = true;

  	this.http.get("/org/name/" + this.model.orgName).map(res => res.json()).subscribe(
  		org => {
	  		this.model.orgId = org._id;
		  	this.http.put("/donation/log", this.model).map(res => res.json()).subscribe(data => {
		  		console.log(data);
		  		if (data.errmsg) {
		  			this.ui.flash("Save failed", "error");
		  			this.saving = false;
		  			return;
		  		}
		  		this.user = data;
		  		this.saving = false;
		  		this.isLogging = false;
		  		this.ui.flash("Saved", "success");
		  		this.updateData();
		  	});
		  },
		  err => {
		  	console.error(err);
		  	return this.ui.flash("Log failed", "error");
		  }
		);
  }

  deleteLog(id, orgId) {
  	this.http.post('/donation/delete/' + id, {orgId: orgId, userId: this.user._id}).map(res => res.json()).subscribe(
	  	data => {
	  		if (data.errmsg) {
	  			return this.ui.flash(data.errmsg, "error");
	  		}
	  		this.user = data;
	  		this.ui.flash("Donation deleted", "success");
	  		this.updateData();
	  	},
	  	err => this.ui.flash("Delete failed", "error")
	  );
  }

  logNew() {
  	this.isLogging = true;
  }

  cancel() {
  	this.isLogging = false;
  }

  toggleOptionsMenu(id) {
  	if (!this.optionsMenus[id]) this.optionsMenus[id] = true;
  	else delete this.optionsMenus[id];
  }

  toggleOffOptionsMenu(id) {
  	delete this.optionsMenus[id];
  }

}