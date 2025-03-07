import {
  ComponentFixture, fakeAsync,
  TestBed, tick
} from '@angular/core/testing';

import { WidgetHeaderComponent } from './widget-header.component';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { of, Subject } from 'rxjs';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { By } from "@angular/platform-browser";

describe('WidgetHeaderComponent', () => {
  let component: WidgetHeaderComponent;
  let fixture: ComponentFixture<WidgetHeaderComponent>;
  let spy = jasmine.createSpyObj('DashboardService', ['removeWidget']);
  let modalSpy = jasmine.createSpyObj('ModalService', ['openHelpModal']);
  const terminalSettingsSub = new Subject();
  let terminalSettingsSpy = {
    getSettings: jasmine.createSpy('getSettings').and.returnValue(terminalSettingsSub)
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WidgetHeaderComponent,
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({ badgeColor: 'yellow', guid: 'testGuid', linkToActive: true })),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        { provide: DashboardService, useValue: spy },
        { provide: ModalService, useValue: modalSpy },
        { provide: TerminalSettingsService, useValue: terminalSettingsSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show badge in dependence of terminal settings', fakeAsync(() => {
    terminalSettingsSub.next({badgesBind: false});
    tick();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('nz-badge[nz-dropdown]'))).toBeFalsy();

    terminalSettingsSub.next({badgesBind: true});
    tick();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('nz-badge[nz-dropdown]'))).toBeTruthy();
  }));

  it('should change badge color', () => {
    const switchBadgeColorSpy = spyOn(component, 'switchBadgeColor').and.callThrough();

    terminalSettingsSub.next({badgesBind: true});
    fixture.debugElement.queryAll(By.css('.badge-menu li'))[1].triggerEventHandler('click', {});

    expect(switchBadgeColorSpy).toHaveBeenCalledOnceWith('blue');
  });
});
