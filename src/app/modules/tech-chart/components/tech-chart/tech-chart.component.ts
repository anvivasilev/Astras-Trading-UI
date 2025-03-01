import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil
} from 'rxjs';
import { TechChartSettings } from '../../../../shared/models/settings/tech-chart-settings.model';
import {
  isEqualTechChartSettings,
  isOrderSubmitSettings
} from '../../../../shared/utils/settings-helper';
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  InitialSettingsMap,
  ISettingsAdapter,
  PlusClickParams,
  ResolutionString,
  SubscribeEventsMap,
  widget
} from '../../../../../assets/charting_library';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { TechChartDatafeedService } from '../../services/tech-chart-datafeed.service';
import { DashboardItemContentSize } from '../../../../shared/models/dashboard-item.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  ThemeSettings,
  ThemeType
} from '../../../../shared/models/settings/theme-settings.model';
import { ModalService } from '../../../../shared/services/modal.service';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { CommandType } from '../../../../shared/models/enums/command-type.model';
import { WidgetsDataProviderService } from '../../../../shared/services/widgets-data-provider.service';
import { SelectedPriceData } from '../../../../shared/models/orders/selected-order-price.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { MathHelper } from '../../../../shared/utils/math-helper';

type ExtendedSettings = { widgetSettings: TechChartSettings, instrument: Instrument };

@Component({
  selector: 'ats-tech-chart[guid][shouldShowSettings][contentSize]',
  templateUrl: './tech-chart.component.html',
  styleUrls: ['./tech-chart.component.less']
})
export class TechChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  contentSize!: DashboardItemContentSize | null;
  @ViewChild('chartContainer', { static: true })
  chartContainer?: ElementRef<HTMLElement>;
  private readonly selectedPriceProviderName = 'selectedPrice';
  private chart?: IChartingLibraryWidget;
  private settings$?: Observable<ExtendedSettings>;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private chartEventSubscriptions: { event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap] }[] = [];

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly techChartDatafeedService: TechChartDatafeedService,
    private readonly themeService: ThemeService,
    private readonly instrumentsService: InstrumentsService,
    private readonly widgetsDataProvider: WidgetsDataProviderService,
    private readonly modalService: ModalService
  ) {
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.widgetsDataProvider.addNewDataProvider<SelectedPriceData>(this.selectedPriceProviderName);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.clearChartEventsSubscription(this.chart);
      this.chart?.remove();
    }

    this.techChartDatafeedService.clear();

    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const chartSettings$ = this.settings$!.pipe(
      distinctUntilChanged((previous, current) => {
        return (
          previous?.widgetSettings?.symbol === current?.widgetSettings?.symbol &&
          previous?.widgetSettings?.exchange === current?.widgetSettings?.exchange
        );
      }),
    );

    combineLatest([
      chartSettings$,
      this.themeService.getThemeSettings()
    ]).pipe(
      takeUntil(this.destroy$),
    ).subscribe(([settings, theme]) => {
      this.createChart(settings.widgetSettings, theme);
    });
  }

  private initSettingsStream() {
    const getInstrumentInfo = (settings: TechChartSettings) => this.instrumentsService.getInstrument(settings).pipe(
      filter((x): x is Instrument => !!x)
    );

    this.settings$ = this.settingsService.getSettings<TechChartSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualTechChartSettings(previous, current)),
      mapWith(
        settings => getInstrumentInfo(settings),
        (widgetSettings, instrument) => ({ widgetSettings, instrument } as ExtendedSettings)
      ),
      shareReplay(1)
    );
  }

  private createSettingsAdapter(initialSettings: TechChartSettings): ISettingsAdapter {
    const scope = this;

    return {
      get initialSettings(): InitialSettingsMap | undefined {
        return initialSettings.chartSettings;
      },

      setValue(key: string, value: string): void {
        scope.settings$?.pipe(
          take(1)
        ).subscribe(settings => {
          scope.settingsService.updateSettings<TechChartSettings>(
            settings.widgetSettings.guid,
            {
              chartSettings: {
                ...settings.widgetSettings.chartSettings,
                [key]: value
              }
            }
          );
        });
      },

      removeValue(key: string): void {
        scope.settings$?.pipe(
          take(1)
        ).subscribe(settings => {
          const updatedSettings = {
            ...settings.widgetSettings.chartSettings
          };

          delete updatedSettings[key];

          scope.settingsService.updateSettings<TechChartSettings>(
            settings.widgetSettings.guid,
            {
              chartSettings: updatedSettings
            }
          );
        });
      }
    };
  }

  private createChart(settings: TechChartSettings, theme: ThemeSettings) {
    if (this.chart) {
      this.clearChartEventsSubscription(this.chart);
      this.chart?.remove();
    }

    if (!this.chartContainer) {
      return;
    }

    const config: ChartingLibraryWidgetOptions = {
      // debug
      // base options
      container: this.chartContainer.nativeElement,
      symbol: `${settings.exchange}:${settings.symbol}:${settings.instrumentGroup}`,
      interval: (settings.chartSettings?.['chart.lastUsedTimeBasedResolution'] ?? '1D') as ResolutionString,
      locale: 'ru',
      library_path: '/assets/charting_library/',
      custom_css_url: '../tv-custom-styles.css',
      datafeed: this.techChartDatafeedService,
      settings_adapter: this.createSettingsAdapter(settings),
      // additional options
      fullscreen: false,
      autosize: true,
      timezone: 'exchange',
      theme: theme.theme === ThemeType.default ? 'Light' : 'Dark',
      time_frames: [
        { text: '1000y', resolution: '1M' as ResolutionString, description: 'Все', title: 'Все' },
        { text: '3y', resolution: '1M' as ResolutionString, description: '3 года', title: '3г' },
        { text: '1y', resolution: '1D' as ResolutionString, description: '1 год', title: '1г' },
        { text: '6m', resolution: '1D' as ResolutionString, description: '6 месяцев', title: '6М' },
        { text: '3m', resolution: '4H' as ResolutionString, description: '3 месяца', title: '3М' },
        { text: '1m', resolution: '1H' as ResolutionString, description: '1 месяц', title: '1М' },
        { text: '14d', resolution: '1H' as ResolutionString, description: '2 недели', title: '2Н' },
        { text: '7d', resolution: '15' as ResolutionString, description: '1 неделя', title: '1Н' },
        { text: '1d', resolution: '5' as ResolutionString as ResolutionString, description: '1 день', title: '1д' },
      ],
      symbol_search_request_delay: 2000,
      //features
      disabled_features: [
        'header_symbol_search',
        'symbol_info',
        'display_market_status',
        'symbol_search_hot_key',
        'save_shortcut'
      ],
      enabled_features: [
        'side_toolbar_in_fullscreen_mode',
        'chart_crosshair_menu'
      ]
    };

    this.chart = new widget(config);

    this.chart.applyOverrides({
      'paneProperties.background': theme.theme === ThemeType.dark ? '#141414' : '#ffffff',
      'paneProperties.backgroundType': 'solid'
    });

    this.subscribeToChartEvent(
      this.chart,
      'drawing',
      () => this.settingsService.updateIsLinked(settings.guid, false)
    );

    this.subscribeToChartEvent(
      this.chart,
      'onPlusClick',
      (params: PlusClickParams) => this.selectPrice(params.price)
    );
  }

  private subscribeToChartEvent(target: IChartingLibraryWidget, event: (keyof SubscribeEventsMap), callback: SubscribeEventsMap[keyof SubscribeEventsMap]) {
    this.chartEventSubscriptions.push({ event: event, callback });
    target.subscribe(event, callback);
  }

  private clearChartEventsSubscription(target: IChartingLibraryWidget) {
    this.chartEventSubscriptions.forEach(subscription => target.unsubscribe(subscription.event, subscription.callback));
    this.chartEventSubscriptions = [];
  }

  private selectPrice(price: number) {
    this.settings$?.pipe(
      mapWith(
        settings => this.settingsService.getSettingsByColor(settings.widgetSettings.badgeColor ?? ''),
        (widgetSettings, relatedSettings) => ({ widgetSettings, relatedSettings })),
      take(1)
    ).subscribe(({ widgetSettings, relatedSettings }) => {
      const submitOrderWidgetSettings = relatedSettings.filter(x => isOrderSubmitSettings(x));
      const roundedPrice = MathHelper.round(price, MathHelper.getPrecision(widgetSettings.instrument.minstep));

      if (submitOrderWidgetSettings.length === 0 || !widgetSettings.widgetSettings.badgeColor) {
        this.modalService.openCommandModal({
          instrument: widgetSettings.widgetSettings,
          type: CommandType.Limit,
          price: roundedPrice,
          quantity: 1
        });
      }
      else {
        this.widgetsDataProvider.setDataProviderValue<SelectedPriceData>(this.selectedPriceProviderName, {
          price: roundedPrice,
          badgeColor: widgetSettings.widgetSettings.badgeColor
        });
      }
    });
  }
}
