import { TableWidthConfig } from 'ng-devui/data-table';

export interface DataTableProperiesInterface {
    maxWidth?: string;
    maxHeight?: string;
    size?: string;
    rowHoveredHighlight?: boolean;
    generalRowHoveredData?: boolean;
    cssClass?: string;
    tableWidth?: string;
    fixHeader?: boolean;
    colDraggable?: boolean;
    colDropFreezeTo?: number;
    tableWidthConfig?: TableWidthConfig[];
    showSortIcon?: boolean;
    showFilterIcon?: boolean;
    showOperationArea?: boolean;
    hideColumn?: string[];
    pageAllChecked?: boolean;
    onlyOneColumnSort?: boolean;
    mutiSort?: any;
    resizeable?: boolean;
    timeout?: number;
    beforeCellEdit?: any;
    headerBg?: boolean;
    tableLayout?: string;
    borderType?: string;
    striped?: boolean;
}