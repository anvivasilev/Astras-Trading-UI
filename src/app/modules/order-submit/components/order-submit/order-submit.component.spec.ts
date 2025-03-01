import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { OrderSubmitComponent } from './order-submit.component';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { Store } from '@ngrx/store';
import {
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from '../../../../shared/utils/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { selectNewPortfolio } from '../../../../store/portfolios/portfolios.actions';
import { PortfolioKey } from '../../../../shared/models/portfolio-key.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import {
  of,
  take
} from 'rxjs';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { Quote } from '../../../../shared/models/quotes/quote.model';
import { OrderService } from '../../../../shared/services/orders/order.service';
import { OrderType } from '../../models/order-form.model';
import { LimitOrderFormValue } from '../order-forms/limit-order-form/limit-order-form.component';
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder
} from '../../../command/models/order.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { MarketOrderFormValue } from '../order-forms/market-order-form/market-order-form.component';
import { StopOrderFormValue } from '../order-forms/stop-order-form/stop-order-form.component';
import { StopOrderCondition } from '../../../../shared/models/enums/stoporder-conditions';

describe('OrderSubmitComponent', () => {
  let component: OrderSubmitComponent;
  let fixture: ComponentFixture<OrderSubmitComponent>;

  let store: any;
  let orderServiceSpy: any;

  const defaultPortfolio = 'D1234';
  const defaultInstrument = TestData.instruments[0];

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopMarketOrder',
        'submitStopLimitOrder'
      ]
    );
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        BrowserAnimationsModule
      ],
      declarations: [
        OrderSubmitComponent,
        mockComponent({
          selector: 'ats-limit-order-form',
          inputs: ['instrument', 'initialValues', 'guid', 'activated']
        }),
        mockComponent({
          selector: 'ats-market-order-form',
          inputs: ['instrument', 'activated']
        }),
        mockComponent({
          selector: 'ats-stop-order-form',
          inputs: ['instrument', 'initialValues', 'guid', 'activated']
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of({ ...defaultInstrument })) }
        },
        {
          provide: InstrumentsService,
          useValue: { getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of(defaultInstrument)) }
        },
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    })
      .overrideComponent(
        OrderSubmitComponent,
        {
          set: {
            providers: [{
              provide: QuotesService,
              useValue: {
                getQuotes: jasmine.createSpy('getQuotes').and.returnValue(of({ bid: 101, ask: 102 } as Quote))
              }
            }]
          }
        }
      )
      .compileComponents();

    store = TestBed.inject(Store);
  });

  beforeEach(() => {
    store.dispatch(selectNewPortfolio({ portfolio: { portfolio: defaultPortfolio } as PortfolioKey }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Limit Order', () => {
    beforeEach(() => {
      component.setSelectedCommandType(OrderType.LimitOrder);
    });

    it('should disable buttons on empty value', fakeAsync(() => {
      component.setLimitOrderValue({} as LimitOrderFormValue);
      component.setLimitOrderValue(null);
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeFalse();
      });
    }));

    it('should enable buttons on NON empty value', fakeAsync(() => {
      component.setLimitOrderValue(null);
      component.setLimitOrderValue({} as LimitOrderFormValue);
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeTrue();
      });
    }));

    it('should pass correct order to service', fakeAsync(() => {
        const expectedOrder: LimitOrder = {
          price: Math.round(Math.random() * 1000),
          quantity: Math.round(Math.random() * 100),
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          instrument: defaultInstrument
        };

        component.setLimitOrderValue({
          price: expectedOrder.price,
          quantity: expectedOrder.quantity,
          instrumentGroup: expectedOrder.instrument.instrumentGroup!
        });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitLimitOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );
  });

  describe('Market Order', () => {
    beforeEach(() => {
      component.setSelectedCommandType(OrderType.MarketOrder);
    });

    it('should disable buttons on empty value', fakeAsync(() => {
      component.setMarketOrderValue({} as MarketOrderFormValue);
      component.setMarketOrderValue(null);
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeFalse();
      });
    }));

    it('should enable buttons on NON empty value', fakeAsync(() => {
      component.setMarketOrderValue(null);
      component.setMarketOrderValue({} as MarketOrderFormValue);
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeTrue();
      });
    }));

    it('should pass correct order to service', fakeAsync(() => {
        const expectedOrder: MarketOrder = {
          quantity: Math.round(Math.random() * 100),
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          instrument: defaultInstrument
        };

        component.setMarketOrderValue({
          quantity: expectedOrder.quantity,
          instrumentGroup: expectedOrder.instrument.instrumentGroup!
        });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );
  });

  describe('Stop Order', () => {
    beforeEach(() => {
      component.setSelectedCommandType(OrderType.StopOrder);
    });

    it('should disable buttons on empty value', fakeAsync(() => {
      component.setStopOrderValue({} as StopOrderFormValue);
      component.setStopOrderValue(null);
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeFalse();
      });
    }));

    it('should enable buttons on NON empty value', fakeAsync(() => {
      component.setStopOrderValue(null);
      component.setStopOrderValue({} as StopOrderFormValue);
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeTrue();
      });
    }));

    it('should pass correct order to service (StopMarketOrder)', fakeAsync(() => {
        const expectedOrder: StopMarketOrder = {
          instrument: defaultInstrument,
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          quantity: Math.round(Math.random() * 100),
          condition: Math.random() < 0.5 ? StopOrderCondition.Less : StopOrderCondition.More,
          triggerPrice: Math.round(Math.random() * 1000),
          stopEndUnixTime: new Date()
        };

        component.setStopOrderValue({
          quantity: expectedOrder.quantity,
          triggerPrice: expectedOrder.triggerPrice,
          condition: expectedOrder.condition,
          stopEndUnixTime: expectedOrder.stopEndUnixTime,
          withLimit: false,
          price: 0
        });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );

    it('should pass correct order to service (StopLimitOrder)', fakeAsync(() => {
        const expectedOrder: StopLimitOrder = {
          instrument: defaultInstrument,
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          quantity: Math.round(Math.random() * 100),
          condition: Math.random() < 0.5 ? StopOrderCondition.Less : StopOrderCondition.More,
          triggerPrice: Math.round(Math.random() * 1000),
          price: Math.round(Math.random() * 1000),
          stopEndUnixTime: new Date(),
        };

        component.setStopOrderValue({
          quantity: expectedOrder.quantity,
          triggerPrice: expectedOrder.triggerPrice,
          condition: expectedOrder.condition,
          stopEndUnixTime: expectedOrder.stopEndUnixTime,
          withLimit: true,
          price: expectedOrder.price
        });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitStopLimitOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );
  });
});
