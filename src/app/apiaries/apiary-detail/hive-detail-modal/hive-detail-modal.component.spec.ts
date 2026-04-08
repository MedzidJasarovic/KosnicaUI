import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HiveDetailModalComponent } from './hive-detail-modal.component';

describe('HiveDetailModalComponent', () => {
  let component: HiveDetailModalComponent;
  let fixture: ComponentFixture<HiveDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HiveDetailModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HiveDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
