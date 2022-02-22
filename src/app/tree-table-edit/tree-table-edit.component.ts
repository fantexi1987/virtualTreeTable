import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, ComponentFactoryResolver, ViewChild, ɵɵsetComponentScope } from '@angular/core';
import { TableWidthConfig } from 'ng-devui/data-table';
import { treeTableDataSource } from '../mock-data-lod';
import { highPerformanceFilter,simDeepClone, changeDateFun } from '../../utils/utils';
import { EditableTip } from 'ng-devui/data-table';
import { genderSource, lockSource, typeSource, searchSelectSource } from './config';

export interface TreeNodeInterface {
  key: string;
  title: string;
  level: number;
  parentKey?: string;
  expand?: boolean;
  isLeaf: boolean;
  isDelete?: boolean;
  isMatch?: boolean;
  _children?: string[];
  [prop: string]: any;
}

@Component({
  selector: 'd-tree-table-edit',
  templateUrl: './tree-table-edit.component.html',
  styleUrls: ['./tree-table-edit.component.less']
})
export class TreeTableEditComponent {
  itemSize = 40;
  itemCount = 6;
  tableHeight = '100%';
  get initData() {
    return highPerformanceFilter(this.treeTableArray, item => !item.parentKey)
  }
  get allTableData() {
    return highPerformanceFilter(this.treeTableArray, item => item);
  }
  get copySearchRes() {
    return highPerformanceFilter(this.searchRes, item => item);
  }
  isOpenAll: boolean = false;
  treeTableMap: { [key: string]: TreeNodeInterface } = {};
  treeTableArray: TreeNodeInterface[] = [];
  visibleNodes: TreeNodeInterface[] = [];
  iconParentOpen: string;
  iconParentClose: string;
  basicDataSource: any = JSON.parse(treeTableDataSource);
  expandArr: Array<any> = [];
  // expandItemKeys: Array<any> = [];
  awayArr: Array<any> = [];
  // awayItemKeys: Array<any> = [];
  saveEdit: Array<any> = [];
  countNum: any = 0;
  totleItem: Number = 0;
  scrollArray: Array<any> = [];
  @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;
  tableWidthConfig: TableWidthConfig[] = [
    {
      field: '#',
      width: '150px'
    },
    {
      field: 'title',
      width: '300px'
    },
    {
      field: 'lock',
      width: '20%'
    },
    {
      field: 'type',
      width: '20%'
    },
    {
      field: 'age',
      width: '30%'
    },
    {
      field: 'gender',
      width: '20%'
    },
    {
      field: 'date',
      width: '30%'
    }
  ];
  dataTableOptions = {
    columns: [
      {
        field: 'lock',
        header: 'Lock'
      },
      {
        field: 'type',
        header: 'Type'
      },
      {
        field: 'age',
        header: 'Age'
      },
      {
        field: 'gender',
        header: 'Gender'
      },
      {
        field: 'date',
        header: 'Date of birth'
      }
    ]
  };
  // editableTip = '<span class="icon icon-chevron-right"></span>';
  genderSource = genderSource;
  lockSource = lockSource;
  typeSource = typeSource;
  isSearch: boolean = false;
  searchRes: Array<any> = [];
  searchSelectSource: Array<any> = searchSelectSource;
  searchAttr: string = 'title';
  parentData: Array<any> = [];
  searchKeyArr: Array<any> = [];
  searchArr: Array<any> = [];

  constructor() { }
  ngOnInit() {
    new Promise((resolve, reject) => {
      try {
        this.basicDataSource = simDeepClone(this.basicDataSource);
        this.treeTableArray = this.basicDataSource.treeTableArray;
        this.totleItem = this.treeTableArray.length;
        this.treeTableMap = this.basicDataSource.treeTableMap;
        this.countNum = this.initData.length;
        this.scrollArray = Array.from(this.initData.keys());
        resolve(true);
      } catch (error) {
        reject(error);
      }
    }).then(() => {
      this.visibleNodes = simDeepClone(this.initData.slice(0, this.itemCount));
    })
  }

  setScrollLength(countNum) {
    this.countNum = countNum;
    this.scrollArray = Array.from(new Array(this.countNum).keys());
  }
  setVisibleNodes(data, flag) {
    this.visibleNodes = simDeepClone(data);
    for (let i = 0; i < this.visibleNodes.length; i++) {
      this.visibleNodes[i].expand = flag;
    }
  }
  getVisiableNodes() {
    const scrollOffset = this.viewPort.measureScrollOffset();
    const firstVisibleIndex = Math.ceil(scrollOffset / this.itemSize);
    const originalDataLength = this.treeTableArray.length;
    if(this.isSearch) {
      if(this.searchArr.length > 0) {
        this.setScrollLength(this.searchRes.length - this.searchArr.length);
        let newSearchRes = this.assemblyAwayData(this.copySearchRes, this.searchArr);
        this.setVisibleNodes(newSearchRes.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
        this.singleExpendFun(this.searchArr);
      } else {
        this.setScrollLength(this.searchRes.length);
        this.setVisibleNodes(this.searchRes.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
      }
    } else {
      if (this.isOpenAll) {
        this.expandArr = [];
        if (this.awayArr.length > 0) {
          this.setScrollLength(originalDataLength - this.awayArr.length);
          let newTreeTableArray = this.assemblyAwayData(this.allTableData, this.awayArr);
          this.setVisibleNodes(newTreeTableArray.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
          this.singleExpendFun(this.awayArr);
        } else {
          this.setScrollLength(this.treeTableArray.length);
          this.setVisibleNodes(this.treeTableArray.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), true);
        }
      } else {
        this.awayArr = [];
        if (this.expandArr.length > 0) {
          this.setScrollLength(this.initData.length + this.expandArr.length);
          let newInitData = this.assemblyExpandData(this.initData, this.expandArr);
          this.visibleNodes = simDeepClone(newInitData.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount));
          let visibleNodesKeys = this.visibleNodes.map(item => item.key);
          let parentKey;
          for (let i = 0; i < this.expandArr.length; i++) {
            parentKey = this.expandArr[i].parentKey;
            if (parentKey && visibleNodesKeys.indexOf(parentKey) > -1) {
              this.visibleNodes.filter(o => o.key === parentKey)[0].expand = true;
            }
          }
        } else {
          this.setScrollLength(this.initData.length);
          this.setVisibleNodes(this.initData.slice(firstVisibleIndex, firstVisibleIndex + this.itemCount), false);
        }
      }
    }
    if(this.saveEdit) {
      this.changeEdit(this.visibleNodes, this.saveEdit);
    }
  }
  singleExpendFun(recordArr) {
    let keyArr = [];
    for (let i = 0; i < recordArr.length; i++) {
      keyArr.push(recordArr[i].parentKey);
    }
    for (let i = 0; i < this.visibleNodes.length; i++) {
      if (keyArr.includes(this.visibleNodes[i].key)) this.visibleNodes[i].expand = false;
    }
  }
  assemblyExpandData(InitData, expandArr) {
    let newExpandArr = [];
    let parentKey;
    for(let i=0; i<expandArr.length; i++) {
      parentKey = expandArr[i].parentKey;
      let pos = InitData.findIndex((v) => v.key === parentKey);
      if(pos !== -1) {
        InitData.splice(pos + 1, 0, expandArr[i]);
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

  assemblyAwayData(arrayData, awayArr) {
    let key;
    for(let i=0; i<awayArr.length; i++) {
      key = awayArr[i].key;
      let pos = arrayData.findIndex((v) => v.key === key);
      if(pos !== -1) {
        arrayData.splice(pos, 1);
      }
    }
    return arrayData;
  }

  changeEdit(visibleNodes, saveEdit) {
    let saveEditArr = saveEdit.map(item => item.key);
    let key;
    for (let i = 0; i < visibleNodes.length; i++) {
      key = visibleNodes[i].key;
      if (key && saveEditArr.indexOf(key) > -1) {
        const index = this.saveEdit.findIndex((v) => v.key === key);
        const { title, lock, type, age, gender, date } = saveEdit[index];
        visibleNodes[i].title = title;
        visibleNodes[i].lock = lock;
        visibleNodes[i].type = type;
        visibleNodes[i].age = age;
        visibleNodes[i].gender = gender;
        visibleNodes[i].date = date;
      }
    }
  }

  scrollFunc(e) {
    e = e || window.event;
    document.getElementById("virtualScroll").scrollBy(0, (e.wheelDelta === 0 ? 0 : e.wheelDelta / Math.abs(e.wheelDelta)) * (-this.itemSize));
  }
  onBodyScroll() {
    this.getVisiableNodes();
  }
  toggleAllNodesExpand(e) {
    this.isOpenAll = e;
    this.getVisiableNodes();
  }
  getNodeIndex = (key) => {
    return this.treeTableArray.findIndex((v) => v.key === key);
  }
  toggleNodeExpand(node: TreeNodeInterface, index: number, $event: boolean): void {
    if(this.isSearch) {
      this.operationSearchArr(node, $event ? 'add' : 'del');
    } else {
      this.isOpenAll ? this.operationAwayArr(node, $event ? 'add' : 'del') : this.operationExpandArr(node, $event ? 'add' : 'del');
    }
    this.getVisiableNodes();
    if(!node.expand && node.key === this.visibleNodes[this.visibleNodes.length - 1].key) {
      this.autoScrollBy();
    }
  }

  autoScrollBy() {
    document.getElementById("virtualScroll").scrollBy(0, this.itemSize * (this.itemCount - 1));
  }

  operationSearchArr(node, status) {
    if(status === 'add') {
      this.publicSingleRecordAdd(node, this.searchArr);
    } else {
      const showNodes = this.publicSingleRecordDel(node);
      let searchNode = [];
      for(let i=0; i<showNodes.length; i++) {
        const key = showNodes[i].key;
        const pos = this.searchRes.findIndex((v) => v.key === key);
        if(pos !== -1) {
          searchNode.push(showNodes[i]);
        }
      }
      // this.searchArr = [...new Set([...this.searchArr, ...searchNode])];
      this.searchArr = this.distinct(this.searchArr, searchNode);
    }
  }

  operationExpandArr(node, status) {
    if (status === 'add') {
      const showNodes = this.getChildrenOfItem(node);
      // this.expandArr.push.apply(this.expandArr, showNodes);
      // this.expandArr = [...new Set(this.expandArr)];
      // this.expandItemKeys = [...new Set([...this.expandItemKeys, node.key])];

      this.expandArr = this.distinct(this.expandArr, showNodes);
    } else {
      this.expandArr = this.expandArr.filter(items => {
        if (!items.key.startsWith(node.key + '-')) return items;
      })
      // this.expandItemKeys = this.expandItemKeys.filter(items => {
      //   if(!items.startsWith(node.key)) return items;
      // })
    }
  }

  operationAwayArr(node, status) {
    if (status === 'add') {
      this.publicSingleRecordAdd(node, this.awayArr);
      // this.expandItemKeys = [...new Set([...this.expandItemKeys, node.key])];
    } else {
      const showNodes = this.publicSingleRecordDel(node);
      // this.awayArr = [...new Set([...this.awayArr, ...showNodes])];
      this.awayArr = this.distinct(this.awayArr, showNodes);
    }
  }

  publicSingleRecordAdd(node, recordArr) {
    const showNodes = this.getChildrenOfItem(node);
    let awayArrKey = recordArr.map(item => item.key);
    let key;
    for (let i = 0; i < showNodes.length; i++) {
      key = showNodes[i].key;
      if (key && awayArrKey.indexOf(key) > -1) {
        const index = recordArr.findIndex((v) => v.key === key);
        recordArr.splice(index, 1);
      }
    }
  }

  publicSingleRecordDel(node) {
    const endKey = (Number((node.key).split('-')[0]) + 1).toString();
    const endPos = this.getNodeIndex(endKey);
    let showNodes;
    showNodes = this.treeTableArray.slice(this.getNodeIndex(node.key) + 1, endPos !== -1? endPos : undefined);
    return showNodes;
  }

  getChildrenOfItem(node) {
    const currentItemPos = this.getNodeIndex(node.key) + 1;
    return this.treeTableArray.slice(
      currentItemPos, currentItemPos + node._children.length
    );
  }

  beforeEditStart = (rowItem, field) => {
    return true;
  }

  beforeEditEnd = (rowItem, field) => {
    if (rowItem && rowItem[field].length < 3) {
      return false;
    } else {
      return true;
    }
  }

  onEditEnd(rowItem, field) {
    if(field === 'dateEdit') {
      rowItem.date = changeDateFun(rowItem.date);
    }
    let pos = this.saveEdit.findIndex((v) => v.key === rowItem.key);
    if(pos !== -1) {
      this.saveEdit.splice(pos, 1, rowItem);
    } else {
      this.saveEdit.push(rowItem);
    }
    if(field !== 'titleEdit' && field !== 'ageEdit') {
      rowItem[field] = false;
    }
  }

  saveBtnClick() {
    console.log(this.saveEdit);
  }

  searchNode(searchTarget) {
    this.searchRes = [];
    this.searchArr = [];
    if(searchTarget) {
      this.isSearch = true;
      if(this.treeTableArray.length < 100) {
        this.getSearchDataLittle(this.treeTableArray, searchTarget, this.searchAttr);
      } else {
        this.getSearchData(this.treeTableArray, this.treeTableArray.length, searchTarget, this.searchAttr);
      }
      this.searchKeyArr = [];
    } else {
      this.isSearch = false;
    }
    this.getVisiableNodes();
  }
  getSearchDataLittle(data, searchTarget, attr) {
    const lowSearchTarget = searchTarget.toLowerCase();
    for(let i=0; i<data.length; i++) {
      if(searchTarget && JSON.stringify(data[i][attr]).toLowerCase().includes(lowSearchTarget)) {
        this.getLastSearchParentData(data[i]);
        if(this.parentData.length > 0) {
          this.searchRes = [...this.searchRes,...this.parentData];
          this.parentData = [];
        }
        if(this.searchKeyArr.indexOf(data[i].key) === -1) {
          this.searchRes.push(data[i]);
          this.searchKeyArr.push(data[i].key);
        }
      }
    }
  }
  getSearchData(data, len, searchTarget, attr) {
    const lowSearchTarget = searchTarget.toLowerCase();
    let loopNum = this.calculationDataNum(len);
    for(let i=0; i<len;) {
      const preparationData = this.everyGroup(data, loopNum, len, i, attr, lowSearchTarget);
      const searchData = preparationData[0];
      const inArr = preparationData[1];
      if(inArr) {
        if(loopNum === 10) {
          this.searchRes.push.apply(this.searchRes, this.getLastSearchData(searchData, attr, searchTarget, lowSearchTarget));
        } else {
          this.getSearchData(searchData, searchData.length, searchTarget, attr);
        }
      }
      if(len - i >= loopNum) {
        i += loopNum;
      } else {
        i = len;
      }
    }
  }
  everyGroup(data, groupNum, len, num, attr, lowSearchTarget) {
    let sliceNum = groupNum;
    if(len - num < groupNum) {
      sliceNum = 0;
    }
    const preparationData = this.batchFilterData(data, num, sliceNum, attr, lowSearchTarget);
    return preparationData;
  }
  batchFilterData(data, num, sliceNum, attr, lowSearchTarget) {
    let rtnData = [];
    let everySearchData;
    if(sliceNum > 0) {
      everySearchData = data.slice(num, num + sliceNum);
    } else {
      everySearchData = data.slice(num);
    }
    const everySearchDataAttr = everySearchData.filter(item => {
      return item[attr];
    });
    const inArr = (JSON.stringify(everySearchDataAttr).toLowerCase()).includes(lowSearchTarget);
    rtnData.push(everySearchData, inArr);
    return rtnData;
  }
  getLastSearchData(lastSearchData, attr, searchTarget, lowSearchTarget) {
    let searchRes = [];
    for(let m=0; m<lastSearchData.length; m++) {
      if(searchTarget && JSON.stringify(lastSearchData[m][attr]).toLowerCase().includes(lowSearchTarget)) {
        this.getLastSearchParentData(lastSearchData[m]);
        if(this.parentData.length > 0) {
          searchRes = [...searchRes,...this.parentData];
          this.parentData = [];
        }
        if(this.searchKeyArr.indexOf(lastSearchData[m].key) === -1) {
          searchRes.push(lastSearchData[m]);
          this.searchKeyArr.push(lastSearchData[m].key);
        }
      }
    }
    return searchRes;
  }

  getLastSearchParentData(data) {
    const parentKey = data.parentKey;
    if(parentKey) {
      const getData = this.treeTableMap[parentKey];
      if(this.searchKeyArr.indexOf(getData.key) === -1) {
        this.parentData.push(getData);
        this.searchKeyArr.push(getData.key);
      }
      if(getData.parentKey) {
        this.getLastSearchParentData(getData);
      } else {
        this.parentData.reverse();
      }
    }
  }
  calculationDataNum(len) {
    const lenStr = len.toString();
    const countNum = lenStr.substr(0, 1);
    const remainderNum = lenStr.substr(1, lenStr.length - 1);
    let loopNum = "1";
    if(Number(remainderNum) === 0 && Number(countNum) === 1) {
      for(let i=0; i<remainderNum.length - 1; i++) {
        loopNum += '0';
      }
    } else {
      for(let i=0; i<remainderNum.length; i++) {
        loopNum += '0';
      }
    }
    return Number(loopNum);
  }

  distinct(recordArr, nodeArr) {
    let arr = recordArr.concat(nodeArr);
    let result = [];
    let obj = {}

    for (let i of arr) {
        if (!obj[i.key]) {
            result.push(i)
            obj[i.key] = 1
        }
    }
    return result;
  }
  
}
