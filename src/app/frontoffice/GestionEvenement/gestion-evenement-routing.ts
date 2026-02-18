import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventListComponent } from './Components/event-list/event-list.component';
import { EventFormComponent } from './Components/event-form/event-form.component';

const routes: Routes = [
  { path: '', component: EventListComponent },
  { path: 'create', component: EventFormComponent },
  { path: 'edit/:id', component: EventFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionEvenementRoutingModule {}