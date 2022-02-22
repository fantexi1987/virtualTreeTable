import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'New-Project';
  tab1acticeID = 'tab2';
  tab2acticeID = 'tab3';

  afterColor: any = [
    {isBtnClick: true},
    {isBtnClick: false},
    {isBtnClick: false},
    {isBtnClick: false}
  ]

  constructor() { }

  ngOnInit() {

  }


  activeTabChange(id) {
  }

  btnClick(num) {
    this.afterColor.forEach((arr, index) => {
      if(num === index) {
        arr.isBtnClick = true;
      } else {
        arr.isBtnClick = false;
      }
    });
  }
}
