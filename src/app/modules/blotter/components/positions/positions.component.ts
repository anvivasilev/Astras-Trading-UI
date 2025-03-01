import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject, combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil
} from 'rxjs';
import {
  map,
  mergeMap
} from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { Column } from '../../models/column.model';
import { PositionFilter } from '../../models/position-filter.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { NzTableComponent } from 'ng-zorro-antd/table';
import { ExportHelper } from "../../utils/export-helper";
import { isEqualBlotterSettings } from "../../../../shared/utils/settings-helper";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { InstrumentBadges } from "../../../../shared/models/instruments/instrument.model";
import { Store } from "@ngrx/store";
import { getSelectedInstrumentsWithBadges } from "../../../../store/instruments/instruments.selectors";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";

interface PositionDisplay extends Position {
  volume: number
}

@Component({
  selector: 'ats-positions[shouldShowSettings][guid]',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.less']
})
export class PositionsComponent implements OnInit, OnDestroy {
  @ViewChild('nzTable')
  table?: NzTableComponent<PositionDisplay>;
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  tableInnerWidth = '1000px';
  displayPositions$: Observable<PositionDisplay[]> = of([]);
  searchFilter = new BehaviorSubject<PositionFilter>({});
  isFilterDisabled = () => Object.keys(this.searchFilter.getValue()).length === 0;
  selectedInstruments$: Observable<InstrumentBadges> = of({});

  private settings$!: Observable<BlotterSettings>;
  private badgeColor = defaultBadgeColor;

  allColumns: Column<PositionDisplay, PositionFilter>[] = [
    {
      id: 'symbol',
      name: 'Тикер',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.symbol.localeCompare(b.symbol),
      searchDescription: 'Поиск по Тикеру',
      searchFn: (position, filter) => filter.symbol ? position.symbol.toLowerCase().includes(filter.symbol.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Биржевой идентификатор ценной бумаги'
    },
    {
      id: 'shortName',
      name: 'Имя',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.shortName.localeCompare(b.shortName),
      searchDescription: 'Поиск по имени',
      searchFn: (position, filter) => filter.shortName ? position.shortName.toLowerCase().includes(filter.shortName.toLowerCase()) : false,
      isSearchVisible: false,
      hasSearch: true,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Наименование позиции'
    },
    {
      id: 'avgPrice',
      name: 'Средняя',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.avgPrice) - Number(b.avgPrice),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Средняя цена'
    },
    {
      id: 'qtyT0',
      name: 'Кол-во Т0',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT0) - Number(b.qtyT0),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом сегодняшних расчётов'
    },
    {
      id: 'qtyT1',
      name: 'Кол-во Т1',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT1) - Number(b.qtyT1),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом завтрашних расчётов'
    },
    {
      id: 'qtyT2',
      name: 'Кол-во Т2',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyT2) - Number(b.qtyT2),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом послезавтрашних расчётов'
    },
    {
      id: 'qtyTFuture',
      name: 'Кол-во ТFuture',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => Number(a.qtyTFuture) - Number(b.qtyTFuture),
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Количество позиций с учётом всех заявок'
    },
    {
      id: 'volume',
      name: 'Объем',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.volume - b.volume,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Объём'
    },
    {
      id: 'unrealisedPl',
      name: 'P/L всего',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.unrealisedPl - b.unrealisedPl,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Соотношение прибыли и убытка'
    },
    {
      id: 'dailyUnrealisedPl',
      name: 'P/L дн.',
      sortOrder: null,
      sortFn: (a: PositionDisplay, b: PositionDisplay) => a.dailyUnrealisedPl - b.dailyUnrealisedPl,
      searchFn: null,
      isSearchVisible: false,
      hasSearch: false,
      filterFn: null,
      listOfFilter: [],
      isFilterVisible: false,
      hasFilter: false,
      tooltip: 'Соотношение прибыли и убытка за сегодня'
    },
  ];
  listOfColumns: Column<PositionDisplay, PositionFilter>[] = [];
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly service: BlotterService,
    private readonly settingsService: WidgetSettingsService,
    private readonly store: Store,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualBlotterSettings(previous, current)),
      shareReplay()
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(s => {
        if (s.positionsColumns) {
          this.listOfColumns = this.allColumns.filter(c => s.positionsColumns.includes(c.id));
          this.tableInnerWidth = `${this.listOfColumns.length * 100}px`;
        }
        this.badgeColor = s.badgeColor!;
      }
    );

    this.displayPositions$ = this.settings$.pipe(
      switchMap(settings => this.service.getPositions(settings)),
      map(positions => positions.map(p => <PositionDisplay>{
        ...p,
        volume: this.round(Number(p.avgPrice) * Math.abs(Number(p.qtyUnits)))
      })),
      mergeMap(positions => this.searchFilter.pipe(
        map(f => positions.filter(o => this.justifyFilter(o, f)))
      ))
    );

    this.selectedInstruments$ = combineLatest([
      this.store.select(getSelectedInstrumentsWithBadges),
      this.terminalSettingsService.getSettings()
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([badges, settings]) => {
          if (settings.badgesBind) {
            return badges;
          }
          return {[defaultBadgeColor]: badges[defaultBadgeColor]};
        })
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  reset(): void {
    this.searchFilter.next({});
  }

  filterChange(text: string, option: string) {
    const newFilter = this.searchFilter.getValue();
    if (option) {
      newFilter[option as keyof PositionFilter] = text;
      this.searchFilter.next(newFilter);
    }
  }

  getFilter(columnId: string) {
    return this.searchFilter.getValue()[columnId as keyof PositionFilter];
  }

  shouldShow(column: string) {
    return this.listOfColumns.map(c => c.id).includes(column);
  }

  round(number: number) {
    return MathHelper.round(number, 2);
  }

  roundPrice(price: number) {
    return price > 10
      ? MathHelper.round(price, 2)
      : MathHelper.round(price, 6);
  }

  selectInstrument(symbol: string, exchange: string) {
    this.service.selectNewInstrument(symbol, exchange, this.badgeColor);
  }

  isFilterApplied(column: Column<PositionDisplay, PositionFilter>) {
    const filter = this.searchFilter.getValue();
    return column.id in filter && filter[column.id] !== '';
  }

  get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  exportToFile() {
    this.settings$.pipe(take(1)).subscribe(settings => {
      ExportHelper.exportToCsv(
        'Позиции',
        settings,
        [...this.table?.data ?? []],
        this.listOfColumns
      );
    });
  }

  private justifyFilter(position: PositionDisplay, filter: PositionFilter): boolean {
    for (const key of Object.keys(filter)) {
      if (filter[key as keyof PositionFilter]) {
        const column = this.listOfColumns.find(o => o.id == key);
        return column?.searchFn ? column.searchFn(position, filter) : false;
      }
    }
    return true;
  }
}
