import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { GestionEvenementRoutingModule } from './gestion-evenement-routing';
import { EventListComponent } from './Components/event-list/event-list.component';
import { EventFormComponent } from './Components/event-form/event-form.component';
import { ActivityFormComponent } from './Components/activity-form/activity-form-component';
import { EventService } from './services/event.service';
import { ActivityService } from './services/activity.service';

@NgModule({
  declarations: [
    EventListComponent,
    EventFormComponent,
    ActivityFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    GestionEvenementRoutingModule
  ],
  providers: [EventService, ActivityService]
})
export class GestionEvenementModule {}