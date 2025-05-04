import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormHomeComponent } from './form-home.component';

// Descripción del conjunto de pruebas para el componente FormHome
describe('FormHomeComponent', () => { // Nombre actualizado
  let component: FormHomeComponent; // Tipo actualizado
  let fixture: ComponentFixture<FormHomeComponent>; // Tipo actualizado

  // Configuración inicial antes de cada prueba
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormHomeComponent, // Componente actualizado
        HttpClientTestingModule, // Para simular peticiones HTTP
        MatDialogModule, // Para el diálogo modal
        ReactiveFormsModule // Para formularios reactivos
      ],
      providers: [
        FormBuilder, // Para construir formularios
        { provide: MatDialogRef, useValue: {} } // Mock del MatDialogRef
      ]
    }).compileComponents();
    
    // Crear instancia del componente
    fixture = TestBed.createComponent(FormHomeComponent); // Componente actualizado
    component = fixture.componentInstance;
    
    // Detectar cambios iniciales
    fixture.detectChanges();
  });

  // Prueba básica: Verificar que el componente se crea correctamente
  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });


});