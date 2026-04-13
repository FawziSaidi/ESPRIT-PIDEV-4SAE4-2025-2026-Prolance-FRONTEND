import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CoursCatalogComponent } from '../cours-catalog/cours-catalog.component';
import { CoursPlayerComponent }  from '../cours-player/cours-player.component';

const routes: Routes = [
  { path: '',    component: CoursCatalogComponent },
  { path: ':id', component: CoursPlayerComponent  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  declarations: [
    CoursCatalogComponent,
    CoursPlayerComponent
  ]
})
export class CoursModule {}