import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators
} from "@angular/forms";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import {
  Subject,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrderSubmitSettings } from "../../../../shared/models/settings/order-submit-settings.model";

@Component({
  selector: 'ats-order-submit-settings[settingsChange][guid]',
  templateUrl: './order-submit-settings.component.html',
  styleUrls: ['./order-submit-settings.component.less']
})
export class OrderSubmitSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<void> = new EventEmitter();
  form!: FormGroup;
  exchanges: string[] = exchangesList;
  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit() {
    this.settingsService.getSettings<OrderSubmitSettings>(this.guid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.form = new FormGroup({
        symbol: new FormControl(settings.symbol, [
          Validators.required,
          Validators.minLength(4)
        ]),
        exchange: new FormControl(settings.exchange, Validators.required),
        instrumentGroup: new FormControl(settings.instrumentGroup)
      });
    });
  }

  submitForm(): void {
    this.settingsService.updateSettings<OrderSubmitSettings>(
      this.guid,
      {
        ...this.form.value,
        linkToActive: false
      });

    this.settingsChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
