import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './frontoffice/components.module';
import { AppComponent } from './app.component';
import { UserLayoutComponent } from './frontoffice/user-layout/user-layout.component';
import { LandingModule } from './authentification/landing/landing.module';
import { AuthModule } from './authentification/auth/auth.module';


@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    AppRoutingModule,
    LandingModule,
    AuthModule,
  ],
  declarations: [
    AppComponent,
    UserLayoutComponent, 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }