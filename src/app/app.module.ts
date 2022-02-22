import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DevUIModule } from 'ng-devui';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
// import { TreeTableEditComponent } from './tree-table-edit/tree-table-edit.component';
import { VirtualScrollTreeTableDemoComponent } from './virtual-scroll-tree-table/virtualScrollTreeTableDemo.component';
import { VirtualScrollTreeTableComponent } from './virtual-scroll-tree-table-assembly/virtualScrollTreeTable.component';

@NgModule({
  declarations: [
    AppComponent,
    // TreeTableEditComponent,
    VirtualScrollTreeTableDemoComponent,
    VirtualScrollTreeTableComponent
  ],
  imports: [
    BrowserModule,
    ScrollingModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DevUIModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  exports: [VirtualScrollTreeTableComponent]
})
export class AppModule { }
