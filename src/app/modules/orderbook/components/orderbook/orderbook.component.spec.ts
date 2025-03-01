import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  of,
  Subject
} from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { mockComponent, sharedModuleImportForTests } from 'src/app/shared/utils/testing';
import { OrderBook } from '../../models/orderbook.model';
import { OrderbookService } from '../../services/orderbook.service';

import { OrderBookComponent } from './orderbook.component';
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../../shared/services/theme.service';

describe('OrderBookComponent', () => {
  let component: OrderBookComponent;
  let fixture: ComponentFixture<OrderBookComponent>;
  const spyOb = jasmine.createSpyObj('OrderbookService', [, 'getHorizontalOrderBook', 'unsubscribe']);
  const ob: OrderBook = {
    rows: [],
    maxVolume: 10,
    chartData: {
      asks: [],
      bids: [],
      minPrice: 0,
      maxPrice: 0
    }
  };
  spyOb.getHorizontalOrderBook.and.returnValue(of(ob));
  const modalSync = jasmine.createSpyObj('ModalService', ['openCommandModal']);
  const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemeSettings']);
  themeServiceSpy.getThemeSettings.and.returnValue(of({
    theme: ThemeType.dark,
    themeColors: {
      sellColor: 'rgba(239,83,80, 1)',
      sellColorBackground: 'rgba(184, 27, 68, 0.4)',
      buyColor: 'rgba(12, 179, 130, 1',
      buyColorBackground: 'rgba(12, 179, 130, 0.4)',
      componentBackground: '#141414',
      primaryColor: '#177ddc',
      purpleColor: '#51258f',
      errorColor: '#a61d24'
    } as ThemeColors
  } as ThemeSettings));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderBookComponent,
        mockComponent({
          selector: 'ats-orderbook-chart',
          inputs: ['guid', 'chartData']
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              symbol: 'SBER',
              exchange: 'MOEX',
              showTable: true
            }))
          }
        },
        {
          provide: InstrumentsService,
          useValue: { getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of({})) }
        },
        { provide: OrderbookService, useValue: spyOb },
        { provide: ModalService, useValue: modalSync },
        { provide: ThemeService, useValue: themeServiceSpy },
      ],
      imports: [
        ...sharedModuleImportForTests
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderBookComponent);
    component = fixture.componentInstance;
    const spy = jasmine.createSpyObj('resize', ['pipe']);
    spy.pipe.and.returnValue(new Subject());
    component.resize = spy;
    fixture.detectChanges();
  });
  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
