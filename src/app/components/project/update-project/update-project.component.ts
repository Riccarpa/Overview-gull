import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { number } from 'ngx-custom-validators/src/app/number/validator';
import { CropperSettings } from 'ngx-img-cropper';
import { ToastrService } from 'ngx-toastr';
import { Client } from 'src/app/models/client.model';
import { Project } from 'src/app/models/project.model';
import { User } from 'src/app/models/user.model';
import { ClientService } from 'src/app/services/client/client.service';
import { ProjectService } from 'src/app/services/project/project.service';
import { UserService } from 'src/app/services/user/user.service';
@Component({
  selector: 'app-update-project',
  templateUrl: './update-project.component.html',
  styleUrls: ['./update-project.component.scss']
})

export class UpdateProjectComponent implements OnInit {

  //variabili di template
  formBasic: FormGroup;
  loadingUpdate: boolean;
  loadingDelete: boolean;
  data: any;
  cropperSettings: CropperSettings;

  constructor(
    private service: ProjectService,
    private route: Router,
    private active: ActivatedRoute,
    private fb: FormBuilder,
    private clientService: ClientService,
    private userService: UserService,
    private toastr: ToastrService,
    private modalService: NgbModal

  ) {

    this.cropperSettings = new CropperSettings();

    this.cropperSettings.cropperDrawSettings.lineDash = true;
    this.cropperSettings.cropperDrawSettings.dragIconStrokeWidth = 0;

    this.data = {};
  }


  project: Project //progetto singolo
  idProject: number //id progetto singolo
  clients: Client[] // lista clienti
  users: User[] = [] // lista utenti 
  associateClient: Client // cliente associato al project
  associateUser: number //numero di user associati al project(.lenght)
  arrayUsersIds = []//array di users associati al proggetto




  projectForm = new FormGroup(
    {
      name: new FormControl(''),
      status: new FormControl(''),
      start_date: new FormControl(''),
      end_date: new FormControl(''),
      progress: new FormControl(''),
      revenue: new FormControl(''),
      client_id: new FormControl(''),
      user_ids: new FormControl(),
    }

  )



  delProject(id: number) {

    this.service.deleteProject(id).subscribe(res => {

      this.loadingDelete = true;
      setTimeout(() => {
        this.loadingDelete = false;
        this.toastr.success(`proggetto eliminato con successo`, 'Success', { timeOut: 3000, progressBar: true });
        this.route.navigate(['home/project'])
      }, 2000);
    })
  }

  updateProject() {

    //invio del form  id e array userIds  al service per update
    let updatedProj = this.projectForm.value
    this.service.updateProject(updatedProj, this.project.id, this.arrayUsersIds).subscribe((res) => {

      this.loadingUpdate = true;
      setTimeout(() => {
        this.loadingUpdate = false;
        this.toastr.success(`proggetto modificato con successo`, 'Success', { timeOut: 3000, progressBar: true });
        this.route.navigate(['home/project'])
      }, 2000);
    })
  }


  updateImg() {

    this.modalService.dismissAll();
    let base64JpgWithoutIndex;
    let base64PngWithoutIndex;
    if (this.data.image.includes('data:image/jpeg;base64,')) {
      base64JpgWithoutIndex = this.data.image.replace('data:image/jpeg;base64,', '');
      this.projectForm.value.logo_data = base64JpgWithoutIndex;
    } else {
      base64PngWithoutIndex = this.data.image.replace('data:image/png;base64,', '');
      this.projectForm.value.logo_data = base64PngWithoutIndex;
    }
  }

  openModalImg(modal) {
    this.modalService.open(modal, { ariaLabelledBy: 'modal-basic-title' })
      .result.then((result) => {

      }, (reason) => {

      });
  }

  removeUserToProject(id: number) {

    for (let i = 0; i < this.arrayUsersIds.length; i++) {
      const e = this.arrayUsersIds[i];
      if (e.id === id) {// se trova doppione elimina 

        this.arrayUsersIds.splice(i, 1)
        this.toastr.success('user rimosso con successo.', 'Success!', { progressBar: true });
        break
      }

    }

  }

  addUserToProject(user: any) {

    let int = parseInt(user.percent)//parso
    user.percent = int//valorizzo

    if (this.arrayUsersIds.length == 0) {
      this.arrayUsersIds.push(user)
      this.toastr.success('user aggiunto con successo.', 'Success!', { progressBar: true });
    } else {

      for (let i = 0; i < this.arrayUsersIds.length; i++) {
        let e = this.arrayUsersIds[i];
        if (e.id !== user.id && i == this.arrayUsersIds.length - 1) { //se ha finito di ciclare e non trova id allora pusha
          this.arrayUsersIds.push(user)
          this.toastr.success('user aggiunto con successo.', 'Success!', { progressBar: true });
          break
        } else if (e.id === user.id) { // se trova un doppione , ma senza percent  allora lo modifica
          if (user.percent) {
            this.arrayUsersIds.splice(i, 1, user)
            this.toastr.success('modifica effettuata ', 'Success!', { progressBar: true });
            console.log(this.arrayUsersIds);

            break
          } else {
            this.toastr.warning('utente giá associato al progetto. o niente da modificare', 'Success!', { progressBar: true });
            break
          }
        }
      }
    }









  }




  ngOnInit(): void {

    if (!this.service.currentProject) {
      this.service.currentProject = this.active.snapshot.paramMap.get('id')
    }

    //retrive del proggetto singolo
    this.service.getUpdateProject().subscribe((res) => {

      this.project = res.data

      if (this.project.logo) {
        this.project.logo = `${this.project.logo}?r=${this.service.randomNumber()}`
      }

      this.projectForm = new FormGroup({

        name: new FormControl(this.project.name),
        status: new FormControl(this.project.status),
        start_date: new FormControl(this.project.start_date),
        end_date: new FormControl(this.project.end_date),
        progress: new FormControl(this.project.progress),
        revenue: new FormControl(this.project.revenue),
        client_id: new FormControl(this.project.client_id),
        user_ids: new FormControl(this.project.user_ids)

      })

      //calcolo del numero di utenti associati al proggetto
      this.associateUser = this.project.user_ids.length


      //get cliente associato al proggetto tramite id
      if (res.data.client_id) {

        let idClient = res.data.client_id
        this.clientService.getClient(idClient).subscribe((res) => {

          this.associateClient = res.data
        })
      }


    })

    this.userService.getUsers().subscribe((res) => {

      this.users = res.data

      for (let j = 0; j < this.users.length; j++) {
        let u = this.users[j];

        for (let i = 0; i < this.project.user_ids.length; i++) {
          let e = this.project.user_ids[i];
          if (e === u.id) {

            this.arrayUsersIds.push({ id: e, cost: u.cost, percent: NaN })
          }
        }
      }

      console.log(this.arrayUsersIds);

    })

    this.clientService.getClients().subscribe((res) => {

      this.clients = res.data
    })










  }
}
