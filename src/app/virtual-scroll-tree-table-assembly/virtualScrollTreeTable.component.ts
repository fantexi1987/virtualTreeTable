import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { AfterContentInit, ChangeDetectorRef, COMPILER_OPTIONS, Component, ContentChildren, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChild } from "@angular/core";
import { DataTableColumnTmplComponent, DataTableComponent } from "ng-devui";
import { DataTableProperiesInterface } from "./dataTableProperties.interface";
import { distinct, FindChild, highPerformanceFilter, highPerformanceMap, simDeepClone } from './utils/utils';
import { VirtualScrollTreeTableAdd, VirtualScrollTreeTableBatchDelete, VirtualScrollTreeTableCheck, VirtualScrollTreeTableCopy, VirtualScrollTreeTableDelete, VirtualScrollTreeTableDrop, VirtualScrollTreeTableSearch } from "./utils/virtualScrollTreeTable.factory";

export interface TreeNodeInterface {
  key: string;
  title: string;
  level: number;
  parentKey?: string;
  expand?: boolean;
  isLeft: boolean;
  isDelete?: boolean;
  isMatch?: boolean;
  _children?: string[];
  [prop: string]: any;
}

@Component({
  selector: 'd-virtual-scroll-tree-table-test',
  templateUrl: './virtualScrollTreeTable.component.html',
  styleUrls: ['./virtualScrollTreeTable.component.less']
})
export class VirtualScrollTreeTableComponent implements OnInit, AfterContentInit, OnChanges {
  @ContentChildren(DataTableColumnTmplComponent) columns: QueryList<DataTableColumnTmplComponent>;
  @ViewChild('dataTable', { static: true }) dataTable: DataTableComponent;

  @ViewChild('cdkVirtualScrollViewport') cdkVirtualScrollViewport;

  @Input() dataSource: any;
  @Input() editOption: any;
  @Input() showRowIndex = 10;
  @Input() dataTableProperties: DataTableProperiesInterface;
  @Input() draggable = false;

  @Output() save = new EventEmitter<any>();
  @Output() allChecked = new EventEmitter<any>();

  virtualScrollTreeTableDelete: any;
  virtualScrollTreeTableAdd: any;
  virtualScrollTreeTableCopy: any;
  virtualScrollTreeTableDrop: any;
  virtualScrollTreeTableSearch: any;
  virtualScrollTreeTableBatchDelete: any;
  virtualScrollTreeTableCheck: any;

  findChild: any;
  itemSize = 40;
  itemCount = 10;
  virtualScrollPadding = '';

  get initData() {
    return highPerformanceFilter(this.treeTableArray, item => !item.parent_node_id);
  }
  get allTableData() {
    return highPerformanceFilter(this.treeTableArray, item => item);
  }
  get copySearchRes() {
    return highPerformanceFilter(this.searchRes, item => item);
  }
  get dataTableEvent() {
    return this.dataTable;
  }
  isOpenAll = false;
  treeTableMap: { [key: string]: TreeNodeInterface } = {};
  treeTableArray: TreeNodeInterface[] = [];
  visibleNodes: TreeNodeInterface[] = [];
  iconParentOpen: string;
  iconParentClose: string;
  basicDataSource: any = [];
  expandArr: Array<any> = [];
  expandClickArr: Array<any> = [];
  expandItemKeys: Array<any> = [];
  toggledArr: Array<any> = [];
  toggledClickArr: Array<any> = [];
  toggledItemKeys: Array<any> = [];
  countNum: any = 0;
  totleItem: Number = 0;
  scrollArray: Array<any> = [];
  @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;

  isSearch = false;
  searchRes: Array<any> = [];
  searchAttr: any = {
    name: '全部',
    value: 'all'
  }
  beforeSearchTarget: any;
  parentData: Array<any> = [];
  searchKeyArr: Array<any> = [];
  searchArr: Array<any> = [];

  itemLevel: any = 1;
  peersNum = 0;

  allChildCol: Array<any> = [];

  saveCopyClickNode: any = [];
  saveCopyNode: any = [];
  copyRowNodeId = "";
  saveCutNode: any = [];
  saveCopyRowChild: any = [];

  isAgainCopy = false;

  dragIconWidth = "";
  dragLine: Array<any> = [];
  beforeDragPosition: any = {
    pos: '',
    index: -1
  };
  dragHiddenNode: any = {
    index: -1,
    nodeId: ''
  };

  halfCheck = false;
  allCheck = false;

  saveCheck: Array<any> = [];
  saveHalfCheck: Array<any> = [];

  cutNodeCheck: Array<any> = [];
  cutNodeHalfCheck: Array<any> = [];

  constructor(private ref: ChangeDetectorRef) {  }

  ngAfterContentInit() {
    this.dataTable.columns = this.columns;
    this.dataTable.updateColumns();
  }

  ngOnChanges(changes): void {
    if (
      (changes['dataSource'])
    ) {
      if(this.dataSource) {
        new Promise((resolve, reject) => {
          try {
            this.basicDataSource = this.dataSource;
            this.basicDataSource = simDeepClone(this.basicDataSource);
            this.treeTableArray = this.basicDataSource;
            this.totleItem = this.treeTableArray.length;
            this.countNum = this.initData.length;
            this.scrollArray = Array.from(this.initData.keys());
            this.itemCount = this.showRowIndex;
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }).then(() => {
          this.visibleNodes = simDeepClone(this.initData.slice(0, this.itemCount));
          this.visibleNodes.forEach(arr => {
            arr.expand = false;
          });
          this.getVisiableDataChange(this.visibleNodes);
          this.changeDisabledNode();
          this.getVisiableNodes();
        });
      } else {
        this.treeTableArray = [];
        this.visibleNodes = [];
      }
    }

    if(
      (changes['dataTableProperties'])
    ) {
      const params = changes['dataTableProperties']['currentValue'];
      this.copyAttribute(this.dataTable, params);
    }

    if(
      (changes['showRowIndex'] && !changes.showRowIndex.firstChange)
    ) {
      this.itemCount = this.showRowIndex;
      this.getVisiableNodes();
    }

    setTimeout(() => {
      if(this.dataTable.fixHeaderContainerRefElement) {
        const dataTableHead = this.dataTable.fixHeaderContainerRefElement.nativeElement.clientHeight;
        this.virtualScrollPadding = dataTableHead + 'px';
      }
    });
  }

  ngOnInit() {
    this.virtualScrollTreeTableDelete = new VirtualScrollTreeTableDelete();
    this.virtualScrollTreeTableAdd = new VirtualScrollTreeTableAdd();
    this.virtualScrollTreeTableCopy = new VirtualScrollTreeTableCopy();
    this.virtualScrollTreeTableDrop = new VirtualScrollTreeTableDrop();
    this.virtualScrollTreeTableSearch = new VirtualScrollTreeTableSearch();
    this.virtualScrollTreeTableBatchDelete  = new VirtualScrollTreeTableBatchDelete();
    this.virtualScrollTreeTableCheck = new VirtualScrollTreeTableCheck();
    this.findChild = new FindChild;

    setTimeout(() => {
      const dragDiv = document.getElementById('dragMouseTip');
      if(dragDiv) {
        document.body.append(dragDiv);
      }
    }) 
  }
  
  changeDisabledNode() {
    const disabledFile = highPerformanceFilter(this.treeTableArray, item => !item.node_type && item.disabled);
    const disabledFolder = highPerformanceFilter(this.treeTableArray, item => item.node_type && item.disabled);

    if(disabledFile.length > 0) {
      for(let i=0; i<disabledFile.length; i++) {
        const checkPos = this.saveCheck.findIndex((v) => v.node_id === disabledFile[i].node_id);
        if(checkPos > -1) {
          this.saveCheck.splice(checkPos, 1);
        }

        if(disabledFile[i] && disabledFile[i].parent_node_id) {
          this.parentDisabled(disabledFile[i].parent_node_id);
        }
      }
    }

    if(disabledFolder.length > 0) {
      for(let i=0; i<disabledFolder.length; i++) {
        const allChildCol = this.findChild.getAllChildrenOfItem(disabledFolder[i], this.treeTableArray);
        const allChild = distinct(allChildCol, []);
        
        if(allChild) {
          this.childDisabled(allChild);
        }

        if(disabledFolder[i] && disabledFolder[i].parent_node_id) {
          this.parentDisabled(disabledFolder[i].parent_node_id);
        }
      }
    }
  }

  childDisabled(allChild) {
    for(let i=0; i<allChild; i++) {
      const pos = this.treeTableArray.findIndex((v) => v.node_id === allChild[i].node_id);
      if(pos > -1) {
        this.treeTableArray[pos].disabled = true;
      }

      const halfCheckPos = this.saveHalfCheck.findIndex((v) => v.node_id === allChild[i].node_id);
      if(halfCheckPos > -1) {
        this.saveHalfCheck.splice(halfCheckPos, 1);
      } else {
        const checkPos = this.saveCheck.findIndex((v) => v.node_id === allChild[i].node_id);
        if(checkPos > -1) {
          this.saveCheck.splice(checkPos, 1);
        }
      }
    }
  }

  parentDisabled(parentId) {
    const parentRes = this.virtualScrollTreeTableCheck.useParentNodeChange(
      parentId, this.treeTableArray, this.saveCheck, this.saveHalfCheck
    );
    this.saveCheck = parentRes.saveCheck;
    this.saveHalfCheck = parentRes.saveHalfCheck;
  }

  copyAttribute(target, updateParams) {
    if(!target) { return; }
    const updateKeys = Object.keys(updateParams);
    if(updateKeys.length) {
      updateKeys.forEach(key => {
        if(key === 'size') {
          if(updateParams[key] === 'md') {
            this.itemSize = 48;
          } else if(updateParams[key] === 'lg') {
            this.itemSize = 56;
          } else {
            this.itemSize = 40;
          }
        }
        target[key] = updateParams[key];
      });
    }
  }

  batchUpdateTable(key, val) {
    const saveArr = this.treeTableArray;
    if(saveArr.length) {
      highPerformanceMap(saveArr, obj => {
        obj[key] = val;
      });
    }
    this.getVisiableNodes();
  }

  updateRowData(node) {
    for(let i=0; i<this.visibleNodes.length; i++) {
      if(this.visibleNodes[i].node_id === node.node_id) {
        this.visibleNodes[i] = node;
      }
    }

    const pos = this.treeTableArray.findIndex((v) => v.node_id === node.node_id);
    if(pos !== -1) {
      this.treeTableArray[pos] = node;
    }
  }

  removeAll() {
    this.expandArr = [];
    this.toggledArr = [];
    this.expandClickArr = [];
    this.toggledClickArr = [];
    this.searchRes = [];
    this.searchArr = [];
    this.saveCheck = [];
    this.saveHalfCheck = [];
    this.getVisiableNodes();
  }

  setScrollLength(countNum) {
    this.countNum = countNum;
    this.scrollArray = Array.from(new Array(this.countNum).keys());
  }
  setVisibleNodes(data, flag) {
    this.visibleNodes = simDeepClone(data);
    for(let i=0; i<this.visibleNodes.length; i++) {
      this.visibleNodes[i].expand = flag;
    }
  }
  getVisiableNodes() {
    const scrollOfset = this.viewPort.measureScrollOffset();
    const firstVisibleIndex = Math.ceil(scrollOfset / this.itemSize);
    const originalDataLength = this.treeTableArray.length;
    if(this.isSearch) {
      if(this.searchArr.length > 0) {
        this.setScrollLength(this.searchRes.length - this.searchArr.length);
        const newSearchRes = this.assemblyToggledData(this.copySearchRes, this.searchArr);
        this.setVisibleNodes(newSearchRes.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
        this.singleExpend(this.searchArr, 'search');
      } else {
        this.setScrollLength(this.searchRes.length);
        this.setVisibleNodes(this.searchRes.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
      }
    } else {
      if(this.isOpenAll) {
        this.expandArr = [];
        this.expandClickArr = [];
        if(this.toggledClickArr.length > 0) {
          const newTreeTableArray = this.assemblyToggledData(this.allTableData, this.toggledArr);
          this.setScrollLength(originalDataLength - this.toggledArr.length);
          if(newTreeTableArray && newTreeTableArray.length > 0) {
            this.setVisibleNodes(newTreeTableArray.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
          }
          this.singleExpend(this.toggledClickArr, 'away');
        } else {
          this.setScrollLength(this.treeTableArray.length);
          this.setVisibleNodes(this.treeTableArray.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
        }
      } else {
        this.toggledArr = [];
        this.toggledClickArr = [];
        if(this.expandClickArr.length > 0) {
          const newInitData = this.assemblyExpandData(this.initData, this.expandArr);
          this.setScrollLength(this.initData.length + this.expandArr.length);
          if(newInitData && newInitData.length > 0) {
            this.visibleNodes = simDeepClone(newInitData.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount));
          }
          this.singleToggled();
        } else {
          this.setScrollLength(this.initData.length);
          this.setVisibleNodes(this.initData.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), false);
        }
      }
    }

    this.getVisiableDataChange(this.visibleNodes);
    this.dataTable.cancelEditingStatus();
  }

  getVisiableDataChange(visibleNodes) {
    this.itemLevel = 1;

    const saveCheckKey = highPerformanceMap(this.saveCheck, item => item.node_id);
    const saveHalfCheckKey = highPerformanceMap(this.saveHalfCheck, item => item.node_id);
    let node_id;
    for(let i=0; i<visibleNodes.length; i++) {
      const index = this.treeTableArray.findIndex((v) => v.node_id === visibleNodes[i].node_id);
      visibleNodes[i].by_order = index + 1;

      if(visibleNodes[i].parent_node_id) {
        this.getParentNodeLevel(visibleNodes[i].parent_node_id, 1);
        visibleNodes[i].level = this.itemLevel;
      } else {
        visibleNodes[i].level = 1;
      }

      node_id = visibleNodes[i].node_id;
      if(node_id) {
        if(saveCheckKey.includes(node_id)) {
          visibleNodes[i].checked = true;
          visibleNodes[i].halfCheck = false;
        } else {
          visibleNodes[i].checked = false;
          if(saveHalfCheckKey.includes(node_id)) {
            visibleNodes[i].halfChecked = true;
          } else {
            visibleNodes[i].halfChecked = false;
          }
        }
      }
    }

    this.allCheckChange();
  }

  allCheckChange() {
    if(this.saveHalfCheck.length > 0) {
      this.halfCheck = true;
      this.allCheck = false;
    } else {
      if(this.saveCheck.length > 0) {
        if(this.saveCheck.length === highPerformanceFilter(this.treeTableArray, item => !item.disabled).length) {
          this.halfCheck = false;
          this.allCheck = true;
        } else {
          this.halfCheck = true;
          this.allCheck = false;
        }
      } else {
        this.halfCheck = false;
        this.allCheck = false;
      }
    }

    const allCheckedObj = {
      allCheck: this.allCheck,
      halfCheck: this.halfCheck
    };
    this.allChecked.emit(allCheckedObj);
  }

  getParentNodeLevel(parent_node_id, level) {
    this.itemLevel = level + 1;
    if(parent_node_id) {
      const data: any = highPerformanceFilter(this.treeTableArray, item => item.node_id === parent_node_id);
      if(data.length > 0) {
        this.getParentNodeLevel(data[0].parent_node_id, this.itemLevel);
      }
    }
  }

  singleExpend(recordArr, status) {
    const keyArr = [];
    for(let i=0; i<recordArr.length; i++) {
      if(status === 'search') {
        keyArr.push(recordArr[i].parent_node_id);
      } else {
        keyArr.push(recordArr[i].node_id);
      }
    }
    for(let i=0; i<this.visibleNodes.length; i++) {
      if(keyArr.includes(this.visibleNodes[i].node_id)) { this.visibleNodes[i].expand = false; }
    }
  }

  singleToggled() {
    const visibleNodesKeys = this.visibleNodes.map(item => item.node_id);
    let node_id;
    for(let i=0; i<this.expandClickArr.length; i++) {
      node_id = this.expandClickArr[i].node_id;
      if(node_id && visibleNodesKeys.indexOf(node_id) > -1) {
        this.visibleNodes.filter(o => o.node_id === node_id)[0].expand = true;
      }
    }
  }

  assemblyExpandData(InitData, expandArr) {
    const newExpandArr = [];
    let parent_node_id;
    for(let i=0; i<expandArr.length; i++) {
      parent_node_id  =expandArr[i].parent_node_id;
      const pos = InitData.findIndex((v) => v.node_id === parent_node_id);
      if(pos !== -1) {
        this.getPeersDataNum(InitData, pos, parent_node_id);
        const realDataPos = this.treeTableArray.findIndex((v) => v.node_id === expandArr[i].node_id);
        if(realDataPos !== -1) {
          const realExpandData = this.treeTableArray[realDataPos];
          InitData.splice(pos + 1 + this.peersNum, 0, realExpandData);
          this.peersNum = 0;
        }
      } else {
        newExpandArr.push(expandArr[i]);
      }
    }
    if(newExpandArr.length > 0) {
      this.assemblyExpandData(InitData, newExpandArr);
    } else {
      return InitData;
    }
  }

  getPeersDataNum(InitData, pos, parent_node_id) {
    const checkDataPos = pos + 1;
    if(InitData[checkDataPos]) {
      const checkDataParent = InitData[checkDataPos].parent_node_id;
      if(checkDataParent === parent_node_id) {
        this.peersNum++;
        this.getPeersDataNum(InitData,checkDataPos, parent_node_id);
      } else {
        return;
      }
    } else {
      return;
    }
  }

  assemblyToggledData(arrayData, toggledArr) {
    let node_id;
    for(let i=0; i<toggledArr.length; i++) {
      node_id = toggledArr[i].node_id;
      const pos = arrayData.findIndex((v) => v.node_id === node_id);
      if(pos !== -1) {
        arrayData.splice(pos, 1);
      }
    }
    return arrayData;
  }

  scroll(e) {
    e.preventDefault();
    const event = e;
    const wheelDelta = event.wheelDelta;
    const step = (wheelDelta === 0 ? 0: wheelDelta / Math.abs(wheelDelta)) * (-this.itemSize);
    this.cdkVirtualScrollViewport.elementRef.nativeElement.scrollBy(0, step);
  }
  onBodyScroll() {
    this.getVisiableNodes();
  }
  toggleAllNodesExpand(e) {
    this.isOpenAll = e;
    this.getVisiableNodes();
  }


  toggleNodeExpand(node: TreeNodeInterface, $event: boolean, isReLoad?) {
    if(node) {
      if(this.isSearch) {
        this.operationSearchArr(node, $event ? 'add' : 'del');
      } else {
        this.isOpenAll ? this.operationToggledArr(node, $event ? 'add' : 'del') : this.operationExpandArr(node, $event ? 'add' : 'del');
      }
      this.getVisiableNodes();

      if(!isReLoad && node.node_id && this.visibleNodes[this.visibleNodes.length - 1].node_id) {
        if(!node.expand && node.node_id === this.visibleNodes[this.visibleNodes.length - 1].node_id) {
          this.scrollToLastItem();
        }
      }
    }
  }

  scrollToLastItem() {
    this.cdkVirtualScrollViewport.elementRef.nativeElement.scrollBy(0, this.itemSize * (this.itemCount - 1));
  }

  operationSearchArr(node, status) {
    if(status === 'add') {
      this.publicSingleRecordAdd(node, this.searchArr);
    } else {
      this.publicSingleRecordDel(node, 'search');
    }
  }

  operationExpandArr(node, status) {
    if(status === 'add') {
      const showNodes = this.findChild.getChildrenOfItem(node, this.treeTableArray);
      this.expandArr = distinct(this.expandArr, showNodes);
      this.expandClickArr = distinct(this.expandClickArr, [node]);
    } else {
      const inNodeData = [];
      inNodeData.push(node);
      this.spliceExpandArrData(inNodeData);
      const allChild = this.getAllChildArr(node);
      let node_id;
      for(let i=0; i<allChild.length; i++) {
        node_id = allChild[i].node_id;
        const pos = this.expandClickArr.findIndex((v) => v.node_id === node_id);
        if(pos !== -1) {
          this.expandClickArr.splice(pos, 1);
        }
      }
    }
  }

  spliceExpandArrData(inNodeData) {
    let nodeChildData = [];
    for(let i=0; i<inNodeData.length; i++) {
      const selectData = this.expandArr.filter(item => {
        if(item.parent_node_id === inNodeData[i].node_id) {
          return item;
        }
      });
      nodeChildData = [...nodeChildData, ...selectData];
    }
    if(nodeChildData.length > 0) {
      for(let i=0; i<nodeChildData.length; i++) {
        const node_id = nodeChildData[i].node_id;
        const index = this.expandArr.findIndex((v) => v.node_id === node_id);
        this.expandArr.splice(index, 1);
      }
      this.spliceExpandArrData(nodeChildData);
    } else {
      return;
    }
  }

  operationToggledArr(node, status) {
    if(status === 'add') {
      this.publicSingleRecordAdd(node, this.toggledArr);
      for(let i=0; i<this.toggledClickArr.length; i++) {
        if(node.node_id === this.toggledClickArr[i].node_id) {
          this.toggledClickArr.splice(i, 1);
        }
      }
    } else {
      this.publicSingleRecordDel(node, 'away');
      const allChild = this.getAllChildArr(node);
      this.toggledClickArr = distinct(this.toggledClickArr, allChild);
    }
  }

  getAllChildArr(node) {
    const allChildCol = this.findChild.getAllChildrenOfItem(node, this.treeTableArray);
    let allChild = distinct(allChildCol, []);
    allChild = allChild.filter(item => item.node_type === 1);
    return allChild;
  }

  publicSingleRecordAdd(node, recordArr) {
    const showNodes = this.findChild.getChildrenOfItem(node, this.treeTableArray);
    const toggledArrKey = recordArr.map(item => item.node_id);
    let node_id;
    for(let i=0; i<showNodes.length; i++) {
      node_id = showNodes[i].node_id;
      if(node_id && toggledArrKey.indexOf(node_id) > -1) {
        const index = recordArr.findIndex((v) => v.node_id === node_id);
        recordArr.splice(index, 1);
      }
    }
  }

  publicSingleRecordDel(node, status) {
    const inNodeData = [];
    inNodeData.push(node);
    this.spliceToggledArrData(inNodeData, status);
  }

  spliceToggledArrData(inNodeData, status) {
    let nodeChild = [];
    for(let i=0; i<inNodeData.length; i++) {
      const inNodeDataChild = this.findChild.getChildrenOfItem(inNodeData[i], this.treeTableArray);
      if(status === 'away') {
        nodeChild = this.toggledArrChange(inNodeDataChild, nodeChild);
      } else {
        nodeChild = this.searchArrChange(inNodeDataChild, nodeChild);
      }
    }

    if(nodeChild.length > 0) {
      this.spliceToggledArrData(nodeChild, status);
    } else {
      return;
    }
  }

  toggledArrChange(inNodeDataChild, nodeChild) {
    this.toggledArr = distinct(this.toggledArr, inNodeDataChild);
    nodeChild = this.getNodeChild(inNodeDataChild, nodeChild);
    return nodeChild;
  }

  searchArrChange(inNodeDataChild, nodeChild) {
    const searchNode = [];
    for(let k=0; k<inNodeDataChild.length; k++) {
      const node_id = inNodeDataChild[k].node_id;
      const pos = this.searchRes.findIndex((v) => v.node_id === node_id);
      if(pos !== -1) {
        searchNode.push(inNodeDataChild[k]);
      }
    }
    this.searchArr = distinct(this.searchArr, searchNode);
    nodeChild = this.getNodeChild(searchNode, nodeChild);
    return nodeChild;
  }

  getNodeChild(childData, nodeChild) {
    for(let k=0; k<childData.length; k++) {
      if(childData[k].node_type) {
        nodeChild.push(childData[k]);
      }
    }
    return nodeChild;
  }

  beforeEditStart = (rowItem, field) => {
    return true;
  };

  beforeEditEnd = (rowItem, field) => {
    return rowItem && rowItem[field].length >=3;
  };

  onEditEnd(rowItem, field) {
    const cloneRow = simDeepClone(rowItem);

    const editSelectField = [];
    Object.keys(this.editOption).forEach(arr => {
      editSelectField.push(arr + 'Edit');
    });

    if(editSelectField.includes(field)) {
      this.dataTable.cancelEditingStatus();
    }

    const treeTablePos = this.treeTableArray.findIndex((v) => v.node_id === cloneRow.node_id);
    this.treeTableArray.splice(treeTablePos, 1, cloneRow);
  }

  searchSelectChange() {
    this.search(this.beforeSearchTarget);
  }

  search(searchTarget) {
    const res = this.virtualScrollTreeTableSearch.search(searchTarget, this.searchAttr, this.treeTableArray);
    this.beforeSearchTarget = res.beforeSearchTarget;
    this.searchRes = res.searchRes;
    this.searchArr = res.searchArr;
    this.isSearch = res.isSearch;
    this.getVisiableNodes();
  }

  addGolbal(status, addTemplate?) {
    if(event) {
      event.stopPropagation();
    }
    if(addTemplate) {
      this.treeTableArray = this.virtualScrollTreeTableAdd.addGolbal(status, this.treeTableArray, addTemplate);
    } else {
      this.treeTableArray = this.virtualScrollTreeTableAdd.addGolbal(status, this.treeTableArray);
    }
    this.getVisiableNodes();
    setTimeout(() => {
      this.addAutoScroll();
    });
  }

  addOperation(rowItem, status, addTemplate?) {
    if(addTemplate) {
      this.treeTableArray = this.virtualScrollTreeTableAdd.addOperation(rowItem, status, this.treeTableArray, addTemplate);
    } else {
      this.treeTableArray = this.virtualScrollTreeTableAdd.addOperation(rowItem, status, this.treeTableArray);
    }

    if(status === 'addDataFolder' || status === 'addDataNode') {
      this.addOperationCheck(rowItem);
    } else {
      if(rowItem.parent_node_id) {
        const parentNode = highPerformanceFilter(this.treeTableArray, item => item.node_id === rowItem.parent_node_id)[0];
        this.addOperationCheck(parentNode);
      }
    }

    this.getVisiableNodes();

    if(!this.isOpenAll) {
      const changeStatus = (status === 'addDataFolder' || status === 'addDataNode') ? 'add' : 'insert';
      this.againExpandNode(changeStatus, rowItem);
    }
  }

  againExpandNode(changeStatus, rowItem) {
    let recordExpNode = [];
    if(changeStatus === 'add') {
      recordExpNode = this.recordExpandChild(rowItem);
      this.changeSingleExpand(rowItem);
    } else {
      const parent_node_id = rowItem.parent_node_id;
      if(parent_node_id) {
        const pos = this.treeTableArray.findIndex((v) => v.node_id === parent_node_id);
        recordExpNode = this.recordExpandChild(this.treeTableArray[pos]);
        this.changeSingleExpand(this.treeTableArray[pos]);
      }
    }

    for(let i=0; i<recordExpNode.length; i++) {
      this.toggleNodeExpand(recordExpNode[i], true, 'isReload');
    }
  }

  changeSingleExpand(row) {
    this.toggleNodeExpand(row, false, 'isReload');
    this.toggleNodeExpand(row, true, 'isReload');
  }

  recordExpandChild(row) {
    const recordExpNode = [];
    const allChildCol = this.findChild.getAllChildrenOfItem(row, this.treeTableArray);
    const allChild = highPerformanceFilter(distinct(allChildCol, []), item => (item.node_id !== row.node_id && item.node_type));
    const allChildNodeId = allChild.map(item => item.node_id);
    for(let i=0; i<this.expandClickArr.length; i++) {
      const node_id = this.expandClickArr[i].node_id;
      if(node_id && allChildNodeId.indexOf(node_id) > -1) {
        recordExpNode.push(this.expandClickArr[i]);
      }
    }
    return recordExpNode;
  }

  addAutoScroll() {
    this.cdkVirtualScrollViewport.elementRef.nativeElement.scrollTo(0, (this.itemSize * this.scrollArray.length));
  }

  addOperationCheck(node) {
    const checkPos = this.saveCheck.findIndex((v) => v.node_id === node.node_id);
    if(checkPos > -1) {
      const childNode = this.findChild.getChildrenOfItem(node, highPerformanceFilter(this.treeTableArray, item => !item.disabled));
      const newChildNode = highPerformanceFilter(
        childNode, item => (highPerformanceMap(this.saveCheck, items => items.node_id)).indexOf(item.node_id) === -1
      )[0];
      this.saveCheck.push(newChildNode);
    }
  }

  copyAndCut(rowItem, status) {
    this.saveCopyClickNode = [];
    this.saveCutNode = [];
    const res = this.virtualScrollTreeTableCopy.copyAndCut(rowItem, status);
    this.saveCopyClickNode = res.saveCopyClickNode;
    this.saveCutNode = res.saveCutNode;
    this.copyRowNodeId = res.copyRowNodeId;

    if(this.saveCutNode.length > 0) {
      this.cutNodeCheckedChange();
    }
  }

  cutNodeCheckedChange() {
    this.cutNodeCheck = [];
    this.cutNodeHalfCheck = [];
    const cutNode = this.saveCutNode[0];

    if(!cutNode.disabled) {
      if(cutNode.node_type) {
        const allChildCol = this.findChild.getAllChildrenOfItem(cutNode, this.treeTableArray);
        const allChild = distinct(allChildCol, []);
        for(let i=0; i<allChild.length; i++) {
          if(allChild[i].node_type) {
            const halfCheckPos = this.saveHalfCheck.findIndex((v) => v.node_id === allChild[i].node_id);
            if(halfCheckPos > -1) {
              this.cutNodeHalfCheck.push(this.saveHalfCheck[halfCheckPos]);
            } else {
              const checkPos = this.saveCheck.findIndex((v) => v.node_id === allChild[i].node_id);
              if(checkPos > -1) {
                this.cutNodeCheck.push(this.saveCheck[checkPos]);
              }
            }
          } else {
            const checkPos = this.saveCheck.findIndex((v) => v.node_id === allChild[i].node_id);
            if(checkPos > -1) {
              this.cutNodeCheck.push(this.saveCheck[checkPos]);
            }
          }
        }
      } else {
        const checkPos = this.saveCheck.findIndex((v) => v.node_id === cutNode.node_id);
        if(cutNode > -1) {
          this.cutNodeCheck.push(this.saveCheck[checkPos]);
        }
      }
    }
  }

  paste(rowItem, status) {
    const spliceArr = {
      expandArr: this.expandArr,
      toggledArr: this.toggledArr,
      expandClickArr: this.expandClickArr,
      toggledClickArr: this.toggledClickArr,
      searchRes: this.searchRes,
      searchArr: this.searchArr
    };

    const res = this.virtualScrollTreeTableCopy.paste(
      rowItem, status, this.treeTableArray, spliceArr, this.saveCheck, this.saveHalfCheck
    );
    this.saveCopyClickNode = res.saveCopyClickNode;
    this.copyRowNodeId = res.copyRowNodeId;
    this.treeTableArray = res.treeTableArray;
    this.saveCheck = res.saveCheck;
    this.saveHalfCheck = res.saveHalfCheck;

    if(this.saveCutNode.length > 0) {
      this.expandArr = res.spliceArr.expandArr;
      this.toggledArr = res.spliceArr.toggledArr;
      this.expandClickArr = res.spliceArr.expandClickArr;
      this.toggledClickArr = res.spliceArr.toggledClickArr;
      this.searchRes = res.spliceArr.searchRes;
      this.searchArr = res.spliceArr.searchArr;

      const cutNode = this.saveCutNode[0];
      if(!cutNode.disabled) {
        if(cutNode.parent_node_id) {
          const parentRes = this.virtualScrollTreeTableCheck.useParentNodeChange(
            cutNode.parent_node_id, this.treeTableArray, this.saveCheck, this.saveHalfCheck
          );
          this.saveCheck = parentRes.saveCheck;
          this.saveHalfCheck = parentRes.saveHalfCheck;
        }

        if(this.cutNodeCheck.length > 0 || this.cutNodeHalfCheck.length > 0) {
          const newCheckData = highPerformanceFilter(
            this.treeTableArray, item => (highPerformanceMap(this.cutNodeCheck, items => items.id)).indexOf(item.id) > -1
          );

          const newHalfCheckData = highPerformanceFilter(
            this.treeTableArray, item => (highPerformanceMap(this.cutNodeHalfCheck, items => items.id)).indexOf(item.id) > -1
          );

          if(this.cutNodeCheck.length === newCheckData.length) {
            this.changeCheckArr(newCheckData, this.saveCheck, 'rep');
          } else {
            this.changeCheckArr(this.cutNodeCheck, this.saveCheck, 'del');
          }

          if(this.cutNodeHalfCheck.length === newHalfCheckData.length) {
            this.changeCheckArr(newHalfCheckData, this.saveHalfCheck, 'rep');
          } else {
            this.changeCheckArr(this.cutNodeHalfCheck, this.saveHalfCheck, 'del');
          }
        }

        const newCutNode = highPerformanceFilter(this.treeTableArray, item => item.node_id === cutNode.node_id)[0];
        if(newCutNode && newCutNode.parent_node_id) {
          const parentRes = this.virtualScrollTreeTableCheck.useParentNodeChange(
            newCutNode.parent_node_id, this.treeTableArray, this.saveCheck, this.saveHalfCheck
          );
          this.saveCheck = parentRes.saveCheck;
          this.saveHalfCheck = parentRes.saveHalfCheck;
        }
      }
    }

    if(status === 'paste') {
      this.changeSingleExpand(rowItem);
    } else {
      setTimeout(() => {
        this.toggleNodeExpand(rowItem, false, 'isReload');
        this.addAutoScroll();
      });
    }
  }
  
  changeCheckArr(newArr, saveArr, status) {
    const saveCheckId = highPerformanceMap(saveArr, item => item.id);
    for(let i=0; i<newArr.length; i++) {
      if(saveCheckId.indexOf(newArr[i].id) > -1) {
        const checkPos = saveArr.findIndex((v) => v.id === newArr[i].id);
        if(status === 'rep') {
          saveArr.splice(checkPos, 1, newArr[i]);
        } else {
          saveArr.splice(checkPos, 1);
        }
      }
    }
  }

  delete(rowItem) {
    const allChildCol = this.findChild.getAllChildrenOfItem(rowItem, this.treeTableArray);
    const allChild = distinct(allChildCol, []);

    this.changeCheckArr(allChild, this.saveCheck, 'del');
    this.changeCheckArr(allChild, this.saveHalfCheck, 'del');

    const spliceArr = {
      expandArr: this.expandArr,
      toggledArr: this.toggledArr,
      expandClickArr: this.expandClickArr,
      toggledClickArr: this.toggledClickArr,
      searchRes: this.searchRes,
      searchArr: this.searchArr
    };
    const res = this.virtualScrollTreeTableDelete.delete(rowItem, this.treeTableArray, spliceArr);
    this.treeTableArray = res.treeTableArray;
    this.expandArr = res.spliceArr.expandArr;
    this.toggledArr = res.spliceArr.toggledArr;
    this.expandClickArr = res.spliceArr.expandClickArr;
    this.toggledClickArr = res.spliceArr.toggledClickArr;
    this.searchRes = res.spliceArr.searchRes;
    this.searchArr = res.spliceArr.searchArr;

    if(rowItem.parent_node_id && !rowItem.disabled) {
      const parentRes = this.virtualScrollTreeTableCheck.useParentNodeChange(
        rowItem.parent_node_id, this.treeTableArray, this.saveCheck, this.saveHalfCheck
      );
      this.saveCheck = parentRes.saveCheck;
      this.saveHalfCheck = parentRes.saveHalfCheck;
    }

    this.getVisiableNodes();
  }

  dragDown(downEvent, rowItem, rowIndex, doc) {
    console.log('11111111');
  }

  // dragDown(downEvent, rowItem, rowIndex, doc) {
  //   doc.onselectstart = function() {
  //     return false;
  //   }
  //   const _this = this;
  //   this.dropUpdatePosition(rowIndex, 'down');

  //   this.dragLine = [];
  //   const columnsResult = this.columns['_results'];

  //   for(let i=0; i<columnsResult.length; i++) {
  //     if(i===0) {
  //       this.dragIconWidth = columnsResult[i].width;
  //     } else {
  //       const obj = {
  //         field: rowItem[columnsResult[i].field],
  //         width: columnsResult[i].width
  //       };
  //       this.dragLine.push(obj);
  //     }
  //   }

  //   const dragDiv = document.getElementById('dragMouseTip');
  //   dragDiv.style.visibility = 'visible';

  //   doc.onmousemove = function(moveEvent) {
  //     _this.onDragOver(moveEvent, downEvent, rowIndex, dragDiv);
  //   };

  //   doc.onmouseup = function(upEvent) {
  //     doc.onmousemove = null;
  //     doc.onmouseup = null;
  //     const dragObj = {
  //       dragFromIndex: rowIndex,
  //       dropIndex: Math.ceil((upEvent.y - downEvent.y)/_this.itemSize) + rowIndex,
  //       dragData: rowItem
  //     };
  //     _this.onDrop(dragObj, dragDiv);
  //     doc.onselectstart = function() {
  //       return true;
  //     }
  //   };
  // }

  // onDragOver(e: any, downEvent, rowIndex, dragDiv) {
  //   if(dragDiv) {
  //     const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  //     const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
      
  //     dragDiv.style.left = e.clientX + scrollLeft + "px";
  //     dragDiv.style.top = e.clientY + scrollTop + "px";
  //   }

  //   const scrollBoxY = this.cdkVirtualScrollViewport.elementRef.nativeElement.getBoundingClientRect().y;
  //   if(scrollBoxY - e.y > 0) {
  //     this.cdkVirtualScrollViewport.elementRef.nativeElement.scrollBy(0, -this.itemSize);
  //   }
  //   if(e.y - scrollBoxY > this.itemSize * (this.itemCount - 1) - 10) {
  //     this.cdkVirtualScrollViewport.elementRef.nativeElement.scrollBy(0, this.itemSize);
  //   }

  //   const dropIndex = Math.ceil((e.y - downEvent.y)/this.itemSize) + rowIndex;
  //   this.dropUpdatePosition(dropIndex, 'move');
  // }

  // onDrop(e: any, dragDiv?) {
  //   const beforeDragDataParentId = e.dragData.parent_node_id? e.dragData.parent_node_id : '';

  //   const res = this.virtualScrollTreeTableDrop.onDrop(
  //     e, this.visibleNodes, this.itemCount, this.treeTableArray, this.expandArr, this.saveCheck, this.saveHalfCheck
  //   );
  //   this.expandArr = res.expandArr;
  //   this.treeTableArray = res.treeTableArray;
  //   this.saveCheck = res.saveCheck;
  //   this.saveHalfCheck = res.saveHalfCheck;

  //   if(!e.dragData.disabled) {
  //     if(beforeDragDataParentId) {
  //       const parentRes = this.virtualScrollTreeTableCheck.useParentNodeChange(
  //         beforeDragDataParentId, this.treeTableArray, this.saveCheck, this.saveHalfCheck
  //       );
  //       this.saveCheck = parentRes.saveCheck;
  //       this.saveHalfCheck = parentRes.saveHalfCheck;
  //     }
  //     const newDragData = highPerformanceFilter(this.treeTableArray, item => item.node_id === e.dragData.node_id)[0];
  //     const checkPos = this.saveCheck.findIndex((v) => v.node_id === newDragData.node_id);
  //     if(checkPos > -1) {
  //       this.saveCheck.splice(checkPos, 1, newDragData);
  //     }
  //     if(newDragData.parent_node_id) {
  //       const parentRes = this.virtualScrollTreeTableCheck.useParentNodeChange(
  //         newDragData.parent_node_id, this.treeTableArray, this.saveCheck, this.saveHalfCheck
  //       );
  //       this.saveCheck = parentRes.saveCheck;
  //       this.saveHalfCheck = parentRes.saveHalfCheck;
  //     }
  //   }

  //   let lastDropIndex = e.dropIndex;
  //   if(lastDropIndex > this.itemCount) {
  //     lastDropIndex = this.itemCount;
  //   }

  //   const newDropParentNode = this.visibleNodes[lastDropIndex - 1];
  //   if(!newDropParentNode || !newDropParentNode.parent_node_id) {
  //     if(newDropParentNode?.node_type === 1 && newDropParentNode?.expand) {
  //       this.dropUpdateExpandFolder(newDropParentNode, true);
  //     } else {
  //       this.getVisiableNodes();
  //     }
  //   } else if(newDropParentNode.parent_node_id) {
  //     if(newDropParentNode.node_type === 1 && newDropParentNode.expand) {
  //       this.dropUpdateExpandFolder(newDropParentNode, true);
  //     } else {
  //       this.dropUpdateExpandFolder(newDropParentNode, false);
  //     }
  //   }
  //   if(dragDiv) {
  //     dragDiv.style.visibility = "hidden";
  //     this.dropUpdatePosition(e.dropIndex, 'up');
  //   }
  // }

  // dropUpdateExpandFolder(newDropParentNode, isParent) {
  //   setTimeout(() => {
  //     let recordExpNode = [];
  //     if(!isParent) {
  //       const parent_node_id = newDropParentNode.parent_node_id;
  //       if(parent_node_id) {
  //         const pos = this.treeTableArray.findIndex((v) => v.node_id === parent_node_id);
  //         recordExpNode = this.recordExpandChild(this.treeTableArray[pos]);
  //         this.changeSingleExpand(this.treeTableArray[pos]);
  //       }
  //     } else {
  //       recordExpNode = this.recordExpandChild(newDropParentNode);
  //       this.changeSingleExpand(newDropParentNode);
  //     }

  //     for(let i=0; i<recordExpNode.length; i++) {
  //       this.toggleNodeExpand(recordExpNode[i], true, 'isReload');
  //     }
  //   });
  // }

  // dropUpdatePosition(dropIndex, status) {
  //   if(dropIndex < 0) {
  //     dropIndex = 0;
  //   }

  //   if(this.visibleNodes.length === this.itemCount) {
  //     if(dropIndex > this.itemCount) {
  //       dropIndex = this.itemCount;
  //     }
  //   } else {
  //     if(dropIndex > this.visibleNodes.length) {
  //       dropIndex = this.visibleNodes.length;
  //     }
  //   }

  //   const columnLength = this.columns['_results'].length;
  //   // const dataTableBody = this.dataTable.devuiNormalScrollBody.nativeElement;
  //   const dataTableBody = <HTMLImageElement>document.getElementById('data-table-virtual-tree').children[0].children[0].children[1].children[1].children[1];
  //   console.log('dataTableBody-------');
  //   console.log(dataTableBody);
  //   console.log(dataTableBody.children[1]);
  //   if(status === "down") {
  //     this.dragHiddenNode.index = dropIndex;
  //     this.dragHiddenNode.nodeId = this.visibleNodes[dropIndex].node_id;
  //     dataTableBody.children[dropIndex].style['display'] = 'none';
  //   } else if(status === 'move') {
  //     if(this.beforeDragPosition.pos && this.beforeDragPosition.index > -1 && this.visibleNodes[this.beforeDragPosition.index]) {
  //       for(let i=0; i<columnLength; i++) {
  //         dataTableBody.children[this.beforeDragPosition.index].children[i].style[this.beforeDragPosition.pos] = '';
  //       }
  //     }

  //     for(let i=0; i<columnLength; i++) {
  //       if(dropIndex === 0) {
  //         dataTableBody.children[0].children[i].style['border-top'] = this.itemSize + 'px solid #beccfa';
  //         this.beforeDragPosition.pos = 'border-top';
  //         this.beforeDragPosition.index = 0;
  //       } else {
  //         dataTableBody.children[dropIndex - 1].children[i].style['border-bottom'] = this.itemSize + 'px solid #beccfa';
  //         this.beforeDragPosition.pos = 'border-bottom';
  //         this.beforeDragPosition.index = dropIndex - 1;
  //       }
  //     }

  //     const newHiddenPos = this.visibleNodes.findIndex((v) => v.node_id === this.dragHiddenNode.nodeId);
  //     if(newHiddenPos > -1) {
  //       if(newHiddenPos !== this.dragHiddenNode.index) {
  //         if(this.dragHiddenNode.index > -1) {
  //           dataTableBody.children[this.dragHiddenNode.index].style['display'] = '';
  //         }
  //         dataTableBody.children[newHiddenPos].style['display'] = 'none';
  //         this.dragHiddenNode.index = newHiddenPos;
  //       }
  //     } else {
  //       if(this.dragHiddenNode.index > -1) {
  //         dataTableBody.children[this.dragHiddenNode.index].style['display'] = '';
  //         this.dragHiddenNode.index = -1;
  //       }
  //     }
  //   } else {
  //     for(let i=0; i<columnLength; i++) {
  //       if(dropIndex === 0) {
  //         dataTableBody.children[0].children[i].style['border-top'] = "";
  //       } else {
  //         dataTableBody.children[dropIndex -1].children[i].style['border-bottom'] = "";
  //       }
  //     }
  //     if(this.dragHiddenNode.index > -1) {
  //       dataTableBody.children[this.dragHiddenNode.index].style['display'] = "";
  //     }
  //   }
  // }

  onRowCheckChange(checked, rowItem) {
    const res = this.virtualScrollTreeTableCheck.onRowCheckChange(
      checked, rowItem, this.treeTableArray, this.saveCheck, this.saveHalfCheck
    );
    this.saveCheck = res.saveCheck;
    this.saveHalfCheck = res.saveHalfCheck;
    this.getVisiableNodes();
  }

  onAllCheckChange(checked) {
    const res = this.virtualScrollTreeTableCheck.onAllCheckChange(checked, this.treeTableArray);
    this.saveCheck = res.saveCheck;
    this.saveHalfCheck = res.saveHalfCheck;

    this.getVisiableNodes();
  }

  batchDelete() {
    const spliceArr = {
      expandArr: this.expandArr,
      toggledArr: this.toggledArr,
      expandClickArr: this.expandClickArr,
      toggledClickArr: this.toggledClickArr,
      searchRes: this.searchRes,
      searchArr: this.searchArr
    };

    const res = this.virtualScrollTreeTableBatchDelete.batchDelete(this.saveCheck, this.treeTableArray, spliceArr);
    this.treeTableArray = res.treeTableArray;
    this.expandArr = res.spliceArr.expandArr;
    this.toggledArr = res.spliceArr.toggledArr;
    this.expandClickArr = res.spliceArr.expandClickArr;
    this.toggledClickArr = res.spliceArr.toggledClickArr;
    this.searchRes = res.spliceArr.searchRes;
    this.searchArr = res.spliceArr.searchArr;

    this.saveCheck = [];
    this.saveHalfCheck = [];

    this.getVisiableNodes();
  }

  saveBtn() {
    const treeTableArray = simDeepClone(this.treeTableArray);
    for(let i=0; i<treeTableArray.length; i++) {
      treeTableArray[i].by_order = i + 1;
    }
    this.save.emit(treeTableArray);
  }
}
