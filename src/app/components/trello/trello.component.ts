import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user/user.service';
import { TrelloService } from 'src/app/services/trello/trello.service';

@Component({
  selector: 'app-trello',
  templateUrl: './trello.component.html',
  styleUrls: ['./trello.component.scss']
})
export class TrelloComponent implements OnInit {

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private uService: UserService,
    private trService: TrelloService
  ) { }

  id = this.route.snapshot.paramMap.get('id');
  user: any;
  isCreatingColumn = false;
  isEditingTitle = false;
  currentDraggingElmnt: string;
  currentColumn = 0;
  currentTask = 0;
  dragOverCard = 0;
  dragOverColumn = 0;

  columns : any;

  trelloColumn = this.fb.array([]);
  
  taskForm = this.fb.group({
    title: [null, Validators.required],
    description: [null],
    checkList: this.fb.array([])
  });

  newColumnName = '';
  newTaskTitle = '';

  @ViewChild("newTask") newTaskInput: ElementRef;

  get checkList(){
    return this.taskForm.controls["checkList"] as FormArray;
  }

  ngOnInit(): void {
    this.uService.retrieveUser(this.id).subscribe((res: any) => {
      this.user = res.data;

    }, (error) => {
      this.toastr.error(error.error.message);
    })

    // this.trService.getUserTaskColumns().subscribe((res: any) => {
    //   this.columns = res.data;     
    // }, (error) => {
    //   this.toastr.error(error.error.message);
    // })

    this.columns = this.trService.getUserTaskColumns()

    for (let i = 0; i < this.columns.length; i++) {
      for (let n = 0; n < this.columns[i].tasks.length; n++) {
        let task = this.columns[i].tasks[n];
        task.checksCompleted = 0;

        for (let v = 0; v < task.checkList.length; v++) {
          if (task.checkList[v].isChecked) {
            task.checksCompleted += 1;
          }
        }   
      } 
    }

    // for (let i = 0; i < this.columns.length; i++) {

    //   let columnForm = this.fb.group({
    //     name: [this.columns[i].name],
    //     color: [this.columns[i].color],
    //     tasks: this.fb.array([])
    //   })

    //   for (let n = 0; n < this.columns[i].tasks.length; n++) {
    //     let task = this.columns[i].tasks[n];

    //     let taskForm = this.fb.group({
    //       title: [task.title, Validators.required],
    //       description: [task.description],
    //       isDragging: [false],
    //       checkList: this.fb.array([])
    //     });

    //     let taskControl = columnForm.get("tasks") as FormArray;

    //     for (let v = 0; v < task.checkList.length; v++) {
    //       const checkForm = this.fb.group({
    //         name: task.checkList[v].name,
    //         isChecked: task.checkList[v].isChecked
    //       })

    //       let checkControl = taskForm.get("checkList") as FormArray;
    //       checkControl.push(checkForm) 
    //     }
    //     taskControl.push(taskForm);
    //   }
    //   this.trelloColumn.push(columnForm);
    // }
  }

  onDrop({dropData}: any, droppedOnColumn: number): void {
    // let taskArray = this.trelloColumn.at(columnId).get("tasks") as FormArray;
    // let taskForm = taskArray.at(taskId)

    // taskArray.removeAt(taskId);

    // //If card dropped on different column
    // if(droppedColumn != columnId){

    //   let dropInArray = this.trelloColumn.at(droppedColumn).get("tasks") as FormArray;
    //   dropInArray.push(taskForm);
      
    // } else {
    //   //Swap card order
    //   taskArray.insert(this.dragOverCard, taskForm);
    // }
    

    //If it's a task card
    if (this.currentDraggingElmnt == "task" && droppedOnColumn != null) {
      let data = dropData.split(',')
      let columnId = data[0];
      let taskId = data[1];

      //If card dropped on different column
      if(droppedOnColumn != columnId){
        let task = this.columns[columnId].tasks.splice(taskId, 1);
        this.columns[droppedOnColumn].tasks.push(task[0]);

      } else {
        //Swap card order
        let array = this.columns[columnId].tasks;
        array[this.dragOverCard] = array.splice(taskId, 1, array[this.dragOverCard])[0];
      }
      //If its a column
    } else if(this.currentDraggingElmnt == "column" && droppedOnColumn == null) {
      //Swap column order
      let array = this.columns;
      let taskId = dropData;
      array[this.dragOverColumn] = array.splice(taskId, 1, array[this.dragOverColumn])[0];
    }
    
  }

  //Give high z-index to current dragging element
  onDragging(columnId : any, taskId : any){
    if (taskId != null) {
      this.currentDraggingElmnt = "task";
      this.columns[columnId].tasks[taskId].isDragging = !this.columns[columnId].tasks[taskId].isDragging; 
    } else {
      this.currentDraggingElmnt = "column";
      this.columns[columnId].isDragging = !this.columns[columnId].isDragging; 
    }
  }

  inputFocus(){
    setTimeout(()=>this.newTaskInput.nativeElement.focus(), 10);  
  }

  // modal and alerts
  openEditTask(content, id : number, taskId : number){
    // let taskArray = this.trelloColumn.at(id).get("tasks") as FormArray;
    // let checkArray = taskArray.at(taskId).get("checkList") as FormArray;

    // this.taskForm.setValue({
    //   title: taskArray.at(taskId).value.title,
    //   description: taskArray.at(taskId).value.description,
    //   isDragging: taskArray.at(taskId).value.isDragging,
    //   checkList: []
    // });

    // for (let i = 0; i < checkArray.length; i++) {
    //   this.taskForm.controls.checkList.push(checkArray.at(i))
    // }
    this.taskForm.reset(); 
    this.checkList.clear();
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });

    this.isEditingTitle = false;

    this.currentColumn = id;
    this.currentTask = taskId;

    let checkboxArray = this.columns[id].tasks[taskId].checkList;

    this.taskForm.setValue({
      title: this.columns[id].tasks[taskId].title,
      description: this.columns[id].tasks[taskId].description,
      checkList: []
    });

    for (let i = 0; i < checkboxArray.length; i++) {
      const checkForm = this.fb.group({
        name: checkboxArray[i].name,
        isChecked: checkboxArray[i].isChecked
      })
      this.checkList.push(checkForm)
    }
  }

  //Prevent press enter from creating new line and creating an empty checkbox with spacebar
  onKeydown(event, inputValue: any){
    if (event.code == 'Enter') {
      event.preventDefault();

    } else if(event.code == 'Space' && inputValue.length == 0){
      event.preventDefault();
    }
  }

  addCheckbox(input: any){
    let string = input.value

    if (string.length > 0) {
      let checkArray = this.taskForm.get("checkList") as FormArray;
      let checkForm;
      
      if (string.includes("\n")) {//If string has more lines, create a checkbox for each line
        let array = string.split("\n");

        for (let i = 0; i < array.length; i++) {
          if (array[i] != '') {
            checkForm = this.fb.group({
              name: [array[i]],
              isChecked: [false]
            })
            checkArray.push(checkForm)  
          }  
        }
      } else {
        checkForm = this.fb.group({
          name: [string],
          isChecked: [false]
        })
        checkArray.push(checkForm)
      }
    }
    input.value = '';
    input.style.height = '40px';
  }

  addColumn(){
    this.isCreatingColumn = false;
    const colors = ['gold', 'yellowgreen', 'tomato', 'deepskyblue'];

    if (this.newColumnName != '') {
      let column = {
        name: this.newColumnName,
        color: `background-color: ${ colors[Math.floor(Math.random() * 4)]}`,
        tasks: []
      }
  
      this.columns.push(column);
      this.newColumnName = '';
    }
    
    this.toastr.success(`Column added successfully`,'Success', { timeOut: 3000, closeButton: true, progressBar: true })
  }

  addTask(columnId : number){
    let taskArray = this.columns[columnId].tasks;
    this.columns[columnId].isCreatingTask = false;

    if (this.newTaskTitle != '') {
      this.taskForm.setValue({
        title: [this.newTaskTitle],
        description: [null],
        checkList: []
      });
  
      let formData = this.taskForm.getRawValue();
      taskArray.push(formData);
      this.newTaskTitle = '';
    }
    
    this.toastr.success(`Task added successfully`,'Success', { timeOut: 3000, closeButton: true, progressBar: true })
  }

  updateTask(){
   
    if(this.taskForm.status == 'INVALID'){
      this.toastr.warning('All fields are required', 'Warning', { timeOut: 3000, closeButton: true});
     
    }else{
      this.modalService.dismissAll()
      let taskArray = this.columns[this.currentColumn].tasks;
      let formData = this.taskForm.getRawValue();
    
      taskArray.splice(this.currentTask, 1, formData);
      let task = taskArray[this.currentTask];
      task.checksCompleted = 0;

      for (let i = 0; i < task.checkList.length; i++) {
        if (task.checkList[i].isChecked) {
          task.checksCompleted += 1;
        }
      }   

      this.toastr.success(`Task updated successfully`,'Success', { timeOut: 3000, closeButton: true, progressBar: true })
    }
  }


  saveBoard(){
    // this.trService.saveTasks(this.columns,this.id).subscribe(res=>{
    //   this.toastr.success('Tasks saved.', 'Success!', {progressBar: true});
      
    // },(error)=>{
    //   this.toastr.error(error.error.message);
    // });
  }

}
