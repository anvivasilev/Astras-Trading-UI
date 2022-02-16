import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoService } from '../../services/info.service';

import { InfoWidgetComponent } from './info-widget.component';

describe('InfoWidgetComponent', () => {
  let component: InfoWidgetComponent;
  let fixture: ComponentFixture<InfoWidgetComponent>;
  const infoSpy = jasmine.createSpyObj('InfoService', ['getExchangeInfo']);
  infoSpy.getExchangeInfo.and.returnValue(null);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoWidgetComponent ],
    })
    .compileComponents();

    TestBed.overrideComponent(InfoWidgetComponent, {
      set: {
        providers: [
          { provide: InfoService, useValue: infoSpy }
        ]
      }
    })
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
