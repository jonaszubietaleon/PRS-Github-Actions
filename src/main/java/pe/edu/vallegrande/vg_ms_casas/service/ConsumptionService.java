package pe.edu.vallegrande.vg_ms_casas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.vg_ms_casas.model.Consumption;
import pe.edu.vallegrande.vg_ms_casas.repository.ConsumptionRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class ConsumptionService {

    @Autowired
    private ConsumptionRepository consumptionRepository;

    public Flux<Consumption> findAll() {
        return consumptionRepository.findAll(); // Sin names
    }

    public Mono<Consumption> findById(Integer id) {
        return consumptionRepository.findByIdWithNames(id); // ✅ Con names
    }

    public Mono<Consumption> save(Consumption consumption) {
        if (consumption.getStatus() == null) {
            consumption.setStatus("A");
        }
        return consumptionRepository.save(consumption);
    }

    public Mono<Consumption> update(Integer id, Consumption consumption) {
        return consumptionRepository.updateConsumption(
                id,
                consumption.getDate(),
                consumption.getId_home(),
                consumption.getQuantity(),
                consumption.getWeight(),
                consumption.getPrice(),
                consumption.getSalevalue()
        ).then(findById(id));
    }

    public Mono<Void> delete(Integer id) {
        return consumptionRepository.inactivateConsumption(id);
    }

    public Mono<Void> restore(Integer id) {
        return consumptionRepository.restoreConsumption(id);
    }

    public Flux<Consumption> findActive() {
        return consumptionRepository.findByStatusWithNames("A");
    }

    public Flux<Consumption> findInactive() {
        return consumptionRepository.findByStatusWithNames("I");
    }
}
