import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { sharedModuleImportForTests } from './shared/utils/testing';
import { SessionTrackService } from "./shared/services/session/session-track.service";
import { TerminalSettingsService } from './modules/terminal-settings/services/terminal-settings.service';
import { ThemeService } from './shared/services/theme.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let sessionTrackServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    sessionTrackServiceSpy = jasmine.createSpyObj('SessionTrackService', ['startTracking', 'stopTracking']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ...sharedModuleImportForTests
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: SessionTrackService, useValue: sessionTrackServiceSpy },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        {
          provide: ThemeService,
          useValue: {
            setTheme: jasmine.createSpy('setTheme').and.callThrough()
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'astras'`, () => {
    expect(component.title).toEqual('astras');
  });
});
