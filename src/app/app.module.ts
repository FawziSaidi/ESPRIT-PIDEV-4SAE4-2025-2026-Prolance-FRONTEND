import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './frontoffice/components.module';
import { AppComponent } from './app.component';
import { UserLayoutComponent } from './frontoffice/user-layout/user-layout.component';
import { LandingModule } from './authentification/landing/landing.module';
import { AuthModule } from './authentification/auth/auth.module';
import { JwtInterceptor } from './Core/interceptors/jwt.interceptor';



@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule,
    AppRoutingModule,
    LandingModule,
    AuthModule,
  ],
  declarations: [
    AppComponent,
    UserLayoutComponent,
    
    
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true          // ← permet d'avoir plusieurs intercepteurs si besoin
    }
    
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
