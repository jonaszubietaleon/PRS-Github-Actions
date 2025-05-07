package pe.edu.vallegrande.vg_ms_casas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import pe.edu.vallegrande.vg_ms_casas.model.Home;
import pe.edu.vallegrande.vg_ms_casas.service.HomeService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/homes")
public class HomeController {


    @Autowired
    private HomeService homeService;

    @GetMapping
    public Flux<Home> getAll() {
        return homeService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<Home> getById(@PathVariable Integer id) {
        return homeService.findById(id);
    }

    @PostMapping
    public Mono<Home> create(@RequestBody Home home) {
        return homeService.save(home);
    }

    @PutMapping("/{id}")
    public Mono<Home> update(@PathVariable Integer id, @RequestBody Home home) {
        return homeService.update(id, home);
    }

    @PutMapping("/{id}/deactivate")
    public Mono<Void> deactivate(@PathVariable Integer id) {
        return homeService.delete(id);
    }

    @PutMapping("/{id}/restore")
    public Mono<Home> restore(@PathVariable Integer id) {
        return homeService.restore(id);
    }

    @GetMapping("/active")
    public Flux<Home> listActive() {
        return homeService.findActive();
    }

    @GetMapping("/inactive")
    public Flux<Home> listInactive() {
        return homeService.findInactive();
    }
}
