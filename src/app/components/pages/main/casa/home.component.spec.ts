import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { HomeComponent } from './home.component'; // Updated component name

describe('HomeComponent', () => { // Updated description
  let component: HomeComponent; // Updated type
  let fixture: ComponentFixture<HomeComponent>; // Updated type

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HomeComponent, // Updated component
        HttpClientTestingModule,
        MatDialogModule
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(HomeComponent); // Updated component
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more test cases here as needed
});