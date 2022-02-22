// import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
// import { Component, ComponentFactoryResolver, ViewChild, ɵɵsetComponentScope } from '@angular/core';
// import { TableWidthConfig } from 'ng-devui/data-table';
// import { treeTableDataSource } from '../mock-data-lod';
// import { highPerformanceFilter,simDeepClone, changeDateFun } from '../../utils/utils';
// import { EditableTip } from 'ng-devui/data-table';
// import { genderSource, lockSource, typeSource, searchSelectSource } from './config';

import { Component, OnInit, ViewChild } from '@angular/core';
import { VirtualScrollTreeTableComponent } from '../virtual-scroll-tree-table-assembly/virtualScrollTreeTable.component';
import { DataTableProperiesInterface } from '../virtual-scroll-tree-table-assembly/dataTableProperties.interface';
import { searchSelectSourceConfig } from './config';
import { treeTableDataSource } from './mock-data-tranf';

@Component({
  selector: 'd-virtual-scroll-tree-table-demo-test',
  templateUrl: './virtualScrollTreeTableDemo.component.html',
  styleUrls: ['./virtualScrollTreeTableDemo.component.less']
})
export class VirtualScrollTreeTableDemoComponent implements OnInit {
  isOpenAll = false;
  isSearch = false;
  saveCopyClickNode = "";
  isCut = false;
  isAddGolbalData = false;
  halfCheck = false;
  allCheck = false;

  @ViewChild('VirtualTableTree') VirtualTableTree: VirtualScrollTreeTableComponent;

  dataSource: any = treeTableDataSource;
  showRowIndex: any = 10;

  dataTableProperties: DataTableProperiesInterface = {
    colDraggable: true,
    colDropFreezeTo: 3,
    fixHeader: true
  };

  editOption: any = {
    category: ['Static', 'Dynamic'],
    type: ['string', 'Integer', 'Long', 'Ciphertext', 'Double', 'BigDecimal', 'Boolean']
  };

  searchSelectSource: any = searchSelectSourceConfig;
  searchAttr: any = searchSelectSourceConfig[0];

  addTemplate: any = {
    "property": "addPro",
    "description": "addDes",
    "category": "Dynamic"
  };

  constructor() {  }

  ngOnInit() {
    this.dataSource = JSON.parse(this.dataSource);
    this.dataSource[2].disabled = true;
    this.dataSource = JSON.stringify(this.dataSource);
  }

  toggleAllNodesExpand(e) {
    this.VirtualTableTree.toggleAllNodesExpand(e);
    this.isOpenAll = e;
  }

  searchSelectChange() {
    this.VirtualTableTree.searchAttr = this.searchAttr;
    this.VirtualTableTree.searchSelectChange();
  }

  search(event) {
    this.VirtualTableTree.search(event);
    if(event) {
      this.isSearch = true;
    } else {
      this.isSearch = false;
    }
  }

  onEditEnd(rowItem, field) {
    this.VirtualTableTree.onEditEnd(rowItem, field);
  }

  toggleNodeExpand(node, $event): void {
    this.VirtualTableTree.toggleNodeExpand(node, $event);
  }

  addOperation(rowItem, status) {
    this.VirtualTableTree.addOperation(rowItem, status, this.addTemplate);
  }

  copyAndCut(rowItem, status) {
    this.saveCopyClickNode = rowItem.node_id;
    if(status === 'cut') {
      this.isCut = true;
    }
    this.VirtualTableTree.copyAndCut(rowItem, status);
  }

  paste(rowItem, status) {
    this.VirtualTableTree.paste(rowItem, status);
    if(this.isCut) {
      this.saveCopyClickNode = "";
      this.isCut = false;
    }
  }

  delete(rowItem) {
    this.VirtualTableTree.delete(rowItem);
  }

  addGolbal(status) {
    this.isAddGolbalData = true;
    this.VirtualTableTree.addGolbal(status, this.addTemplate);
    this.isAddGolbalData = false;
  }

  saveBtn() {
    this.VirtualTableTree.saveBtn();
  }

  save(event) {
    console.log(event);
  }

  dataTableEvent() {
    console.log(this.VirtualTableTree.dataTableEvent);
  }

  dragDown(downEvent, rowItem, rowIndex) {
    this.VirtualTableTree.dragDown(downEvent, rowItem, rowIndex, document);
  }

  onRowCheckChange(event, rowItem) {
    this.VirtualTableTree.onRowCheckChange(event, rowItem);
  }

  onAllCheckChange(event) {
    this.VirtualTableTree.onAllCheckChange(event);
  }

  allChecked(event) {
    this.allCheck = event.allCheck;
    this.halfCheck = event.halfCheck;
  }

  batchDelete() {
    this.VirtualTableTree.batchDelete();
  }
}
