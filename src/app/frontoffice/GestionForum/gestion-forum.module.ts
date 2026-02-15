import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ForumListComponent } from './components/forum-list/forum-list.component';
import { PublicationFormComponent } from './components/publication-form/publication-form.component';
import { CommentaireModalComponent } from './components/commentaire-modal/commentaire-modal.component';

import { PublicationService } from './services/publication.service';
import { CommentaireService } from './services/commentaire.service';

// IMPORTANT: Importer le module de routing
import { GestionForumRoutingModule } from './gestion-forum-routing.module';

@NgModule({
  declarations: [
    ForumListComponent,
    PublicationFormComponent,
    CommentaireModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    GestionForumRoutingModule  // Ajouter le routing module
  ],
  providers: [
    PublicationService,
    CommentaireService
  ],
  exports: [
    ForumListComponent
  ]
})
export class GestionForumModule { }