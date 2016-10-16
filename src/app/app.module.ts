import { NgModule, Injectable } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UPLOAD_DIRECTIVES } from 'ng2-uploader';
import { ToastyModule } from 'ng2-toasty';

import { AppComponent } from './app.component';
import { LoginComponent } from './login.component';
import { SignupComponent } from './signup.component';
import { AboutComponent } from './about.component';
import { StarredOrgsComponent } from './starred-orgs.component';
import { RecommendedOrgsComponent } from './recommended-orgs.component';
import { BrowseOrgsComponent } from './browse-orgs.component';
import { OrgDetailsComponent } from './org-details.component';
import { OrgPostsComponent } from './org-posts.component';
import { SingleOrgComponent } from './single-org.component';
import { ManageOrgPageComponent } from './manage-org-page.component';
import { ClaimOrgComponent } from './claim-org.component';
import { VerifyOrgsComponent } from './verify-orgs.component';
import { CreateOrgComponent } from './create-org.component';
import { CreatePostComponent } from './create-post.component';
import { SearchBox } from './search-box.component';
import { ContactComponent } from './contact.component';
import { FormFieldComponent } from './form-field.component';

import { UserService } from './services/user.service';
import { SearchService } from './services/search.service';
import { ClickOutsideModule } from 'ng2-click-outside';
import { Categories } from './services/categories.service';
import { OrgService } from './services/org.service';
import { UIHelper, Utilities } from './services/app.service';
import { TruncatePipe } from './pipes/truncate.pipe';

import { enableProdMode } from '@angular/core';
enableProdMode();

const routing = RouterModule.forRoot([
    { path: 'browse', component: BrowseOrgsComponent }
  , { path: 'null', redirectTo: '' }
  , { path: 'category/:id', component: BrowseOrgsComponent }
  , { path: 'login', component: LoginComponent }
  , { path: 'signup', component: SignupComponent }
  , { path: 'about', component: AboutComponent }
  , { path: 'starred', component: StarredOrgsComponent }
  , { path: 'contact', component: ContactComponent }
  , { path: 'organization/create', component: CreateOrgComponent }
  , { path: 'organization/i/:id', component: SingleOrgComponent }
  , { path: 'organization/:slug', component: SingleOrgComponent }
  , { path: 'organization/manage/:id', component: ManageOrgPageComponent }
  , { path: 'organization/claim/:id', component: ClaimOrgComponent }
  , { path: 'verify-organizations', component: VerifyOrgsComponent }
  , { path: '', component: BrowseOrgsComponent }
  , { path: '*', component: BrowseOrgsComponent }
]); // the order of this array matters

@NgModule({
    imports: [
        BrowserModule
      ,	routing
      , HttpModule
      ,	FormsModule
      ,	ReactiveFormsModule
      , ClickOutsideModule
      , ToastyModule.forRoot()
    ],
    declarations: [
        AppComponent
      , LoginComponent
      , SignupComponent
      , BrowseOrgsComponent
      , SearchBox
      , OrgDetailsComponent
      , OrgPostsComponent
      , SingleOrgComponent
      , ManageOrgPageComponent
      , ClaimOrgComponent
      , VerifyOrgsComponent
    	, AboutComponent
      , StarredOrgsComponent
      , RecommendedOrgsComponent
      , ContactComponent
      , UPLOAD_DIRECTIVES
      , CreateOrgComponent
      , CreatePostComponent
      , TruncatePipe
      , FormFieldComponent
    ],
    providers: [
        Title
      , UserService
      , SearchService
      , Categories
      , OrgService
      , UIHelper
      , Utilities
    ],
    bootstrap: [AppComponent]
})

export class AppModule { }