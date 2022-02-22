import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// import { TreeTableEditComponent } from './tree-table-edit/tree-table-edit.component';
import { VirtualScrollTreeTableDemoComponent } from './virtual-scroll-tree-table/virtualScrollTreeTableDemo.component';


const routes: Routes = [ 
// {
//   path: 'treeTableEdit',
//   component: TreeTableEditComponent,
// },
{
  path: 'VirtualScrollTreeTableDemo',
  component: VirtualScrollTreeTableDemoComponent,
}
];

@NgModule({
  imports: [FormsModule, ReactiveFormsModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
