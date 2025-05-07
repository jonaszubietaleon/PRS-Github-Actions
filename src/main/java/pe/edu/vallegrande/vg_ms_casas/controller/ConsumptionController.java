package pe.edu.vallegrande.vg_ms_casas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.vg_ms_casas.model.Consumption;
import pe.edu.vallegrande.vg_ms_casas.service.ConsumptionService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/consumption")
public class ConsumptionController {

    @Autowired
    private ConsumptionService consumptionService;

    @GetMapping
    public Flux<Consumption> getAll() {
        return consumptionService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<Consumption> getById(@PathVariable Integer id) {
        return consumptionService.findById(id);
    }

    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> create(@RequestBody Consumption consumption) {
        return consumptionService.save(consumption)
                .map(saved -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "El consumo ha sido registrado correctamente.");
                    response.put("consumo", saved);
                    return ResponseEntity.ok(response);
                });
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> update(@PathVariable Integer id, @RequestBody Consumption consumption) {
        return consumptionService.update(id, consumption)
                .map(updated -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "El consumo ha sido actualizado correctamente.");
                    response.put("consumo", updated);
                    return ResponseEntity.ok(response);
                });
    }

    @PutMapping("/{id}/inactivar")
    public Mono<ResponseEntity<Map<String, String>>> delete(@PathVariable Integer id) {
        return consumptionService.delete(id)
                .thenReturn(createResponse("El consumo ha sido inactivado."));
    }

    @PutMapping("/{id}/restore")
    public Mono<ResponseEntity<Map<String, String>>> restore(@PathVariable Integer id) {
        return consumptionService.restore(id)
                .thenReturn(createResponse("El consumo ha sido restaurado."));
    }

    @GetMapping("/lista-activos")
    public Flux<Consumption> listActive() {
        return consumptionService.findActive();
    }

    @GetMapping("/lista-inactivos")
    public Flux<Consumption> listInactive() {
        return consumptionService.findInactive();
    }

    private ResponseEntity<Map<String, String>> createResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return ResponseEntity.ok(response);
    }
}
