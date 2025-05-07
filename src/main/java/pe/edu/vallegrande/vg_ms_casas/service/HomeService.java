package pe.edu.vallegrande.vg_ms_casas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.vg_ms_casas.model.Home;
import pe.edu.vallegrande.vg_ms_casas.repository.HomeRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class HomeService {

    @Autowired
    private HomeRepository homeRepository;

    public Flux<Home> findAll() {
        return homeRepository.findAll();
    }

    public Mono<Home> findById(Integer id) {
        return homeRepository.findById(id);
    }

    public Mono<Home> save(Home home) {
        return homeRepository.save(home);
    }

    public Mono<Home> update(Integer id, Home home) {
        return homeRepository.findById(id)
                .flatMap(existingHome -> {
                    existingHome.setNames(home.getNames());
                    existingHome.setAddress(home.getAddress());
                    return homeRepository.save(existingHome);
                });
    }

    public Mono<Void> delete(Integer id) {
        return homeRepository.findById(id)
                .flatMap(existingHome -> {
                    existingHome.setStatus("I");
                    return homeRepository.save(existingHome);
                }).then();
    }

    public Mono<Home> restore(Integer id) {
        return homeRepository.findById(id)
                .flatMap(home -> {
                    home.setStatus("A");
                    return homeRepository.save(home);
                });
    }

    public Flux<Home> findActive() {
        return homeRepository.findByStatus("A");
    }

    public Flux<Home> findInactive() {
        return homeRepository.findByStatus("I");
    }
}
