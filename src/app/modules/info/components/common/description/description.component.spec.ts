import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoService } from '../../../services/info.service';

import { DescriptionComponent } from './description.component';
import { mockComponent } from "../../../../../shared/utils/testing";

describe('DescriptionComponent', () => {
  let component: DescriptionComponent;
  let fixture: ComponentFixture<DescriptionComponent>;

  const infoSpy = jasmine.createSpyObj('InfoService', ['getDescription', 'getExchangeInfo']);
  infoSpy.getDescription.and.returnValue(null);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        DescriptionComponent,
        mockComponent({
          selector: 'ats-loading-indicator',
          inputs: ['isLoading']
        })
      ],
      providers: [
        { provide: InfoService, useValue: infoSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
