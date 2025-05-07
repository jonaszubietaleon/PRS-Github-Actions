package pe.edu.vallegrande.vg_ms_casas.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Table("consumption")
public class Consumption {

    @Id
    private Integer id_consumption;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private Integer id_home;
    private String names;
    private Integer quantity;
    private Double weight;
    private Integer price;
    private Double salevalue;
    private String status;



}
